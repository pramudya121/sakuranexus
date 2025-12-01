import { ethers } from 'ethers';
import { getSakuraNFTContract, getSakuraMarketplaceContract, getOfferContract, parsePrice, formatPrice } from './wallet';
import { supabase } from '@/integrations/supabase/client';
import { CONTRACTS } from './config';

// Upload image to Supabase Storage
export const uploadImage = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('nft-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('nft-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

// Mint NFT
export const mintNFT = async (
  file: File,
  name: string,
  description: string,
  ownerAddress: string
): Promise<{ success: boolean; tokenId?: number; error?: string }> => {
  try {
    // 1. Upload image to Supabase
    const imageUrl = await uploadImage(file);
    if (!imageUrl) {
      return { success: false, error: 'Failed to upload image' };
    }

    // 2. Create metadata (simple metadata with just the image URL)
    const metadataUri = imageUrl;

    // 3. Get contract and mint
    const contract = await getSakuraNFTContract();
    if (!contract) {
      return { success: false, error: 'Failed to connect to contract' };
    }

    const tx = await contract.mintNFT(ownerAddress, metadataUri);
    const receipt = await tx.wait();

    // Get tokenId from event
    const mintedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'Minted';
      } catch {
        return false;
      }
    });

    let tokenId = 0;
    if (mintedEvent) {
      const parsed = contract.interface.parseLog(mintedEvent);
      tokenId = Number(parsed?.args?.tokenId || 0);
    }

    // 4. Save to Supabase database
    const { error: dbError } = await supabase.from('nfts').insert({
      token_id: tokenId,
      contract_address: CONTRACTS.SakuraNFT,
      owner_address: ownerAddress.toLowerCase(),
      name,
      description,
      image_url: imageUrl,
      metadata_uri: metadataUri,
    });

    if (dbError) {
      console.error('Error saving to database:', dbError);
    }

    // 5. Record activity
    await supabase.from('activities').insert({
      activity_type: 'mint',
      to_address: ownerAddress.toLowerCase(),
      contract_address: CONTRACTS.SakuraNFT,
      token_id: tokenId,
      transaction_hash: receipt.hash,
    });

    return { success: true, tokenId };
  } catch (error: any) {
    console.error('Error minting NFT:', error);
    return { success: false, error: error.message || 'Failed to mint NFT' };
  }
};

// Approve NFT for marketplace
export const approveNFT = async (tokenId: number): Promise<boolean> => {
  try {
    const contract = await getSakuraNFTContract();
    if (!contract) return false;

    const tx = await contract.approve(CONTRACTS.SakuraMarketplace, tokenId);
    await tx.wait();

    return true;
  } catch (error) {
    console.error('Error approving NFT:', error);
    return false;
  }
};

// List NFT for sale
export const listNFT = async (
  tokenId: number,
  price: string,
  sellerAddress: string
): Promise<{ success: boolean; listingId?: number; error?: string }> => {
  try {
    // 1. Approve marketplace to transfer NFT
    const approved = await approveNFT(tokenId);
    if (!approved) {
      return { success: false, error: 'Failed to approve NFT' };
    }

    // 2. List on marketplace contract
    const contract = await getSakuraMarketplaceContract();
    if (!contract) {
      return { success: false, error: 'Failed to connect to marketplace' };
    }

    const priceInWei = parsePrice(price);
    const tx = await contract.listNFT(CONTRACTS.SakuraNFT, tokenId, priceInWei);
    const receipt = await tx.wait();

    // Get listingId from event
    const listedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'Listed';
      } catch {
        return false;
      }
    });

    let listingId = 0;
    if (listedEvent) {
      const parsed = contract.interface.parseLog(listedEvent);
      listingId = Number(parsed?.args?.listingId || 0);
    }

    // 3. Save listing to database
    const { data: nft } = await supabase
      .from('nfts')
      .select('id')
      .eq('token_id', tokenId)
      .eq('contract_address', CONTRACTS.SakuraNFT)
      .single();

    if (nft) {
      await supabase.from('listings').insert({
        listing_id: listingId,
        nft_id: nft.id,
        seller_address: sellerAddress.toLowerCase(),
        contract_address: CONTRACTS.SakuraNFT,
        token_id: tokenId,
        price: price,
        active: true,
      });
    }

    // 4. Record activity
    await supabase.from('activities').insert({
      activity_type: 'list',
      from_address: sellerAddress.toLowerCase(),
      price: price,
      contract_address: CONTRACTS.SakuraNFT,
      token_id: tokenId,
      transaction_hash: receipt.hash,
    });

    return { success: true, listingId };
  } catch (error: any) {
    console.error('Error listing NFT:', error);
    return { success: false, error: error.message || 'Failed to list NFT' };
  }
};

// Buy NFT
export const buyNFT = async (
  listingId: number,
  price: string,
  buyerAddress: string,
  tokenId: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const contract = await getSakuraMarketplaceContract();
    if (!contract) {
      return { success: false, error: 'Failed to connect to marketplace' };
    }

    const priceInWei = parsePrice(price);
    const tx = await contract.buyNFT(listingId, { value: priceInWei });
    const receipt = await tx.wait();

    // Update database
    await supabase
      .from('listings')
      .update({ active: false })
      .eq('listing_id', listingId);

    await supabase
      .from('nfts')
      .update({ owner_address: buyerAddress.toLowerCase() })
      .eq('token_id', tokenId)
      .eq('contract_address', CONTRACTS.SakuraNFT);

    // Record activity
    await supabase.from('activities').insert({
      activity_type: 'sale',
      to_address: buyerAddress.toLowerCase(),
      price: price,
      contract_address: CONTRACTS.SakuraNFT,
      token_id: tokenId,
      transaction_hash: receipt.hash,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error buying NFT:', error);
    return { success: false, error: error.message || 'Failed to buy NFT' };
  }
};

// Make offer on NFT
export const makeOffer = async (
  tokenId: number,
  offerPrice: string,
  offererAddress: string
): Promise<{ success: boolean; offerId?: number; error?: string }> => {
  try {
    const contract = await getOfferContract();
    if (!contract) {
      return { success: false, error: 'Failed to connect to offer contract' };
    }

    const priceInWei = parsePrice(offerPrice);
    const tx = await contract.makeOffer(CONTRACTS.SakuraNFT, tokenId, { value: priceInWei });
    const receipt = await tx.wait();

    // Get offerId from OfferMade event
    const offerMadeEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'OfferMade';
      } catch {
        return false;
      }
    });

    let offerId = 0;
    if (offerMadeEvent) {
      const parsed = contract.interface.parseLog(offerMadeEvent);
      offerId = Number(parsed?.args?.offerId || 0);
    }

    // Save offer to database
    const { data: nft } = await supabase
      .from('nfts')
      .select('id')
      .eq('token_id', tokenId)
      .eq('contract_address', CONTRACTS.SakuraNFT)
      .single();

    if (nft) {
      await supabase.from('offers').insert({
        nft_id: nft.id,
        offerer_address: offererAddress.toLowerCase(),
        contract_address: CONTRACTS.SakuraNFT,
        token_id: tokenId,
        offer_price: offerPrice,
        status: 'pending',
        offer_id: offerId,
      });
    }

    // Log to offer_logs
    await supabase.from('offer_logs').insert({
      offer_id: offerId,
      action: 'make',
      user_address: offererAddress.toLowerCase(),
      token_id: tokenId,
      amount: offerPrice,
      transaction_hash: receipt.hash,
    });

    // Record activity
    await supabase.from('activities').insert({
      activity_type: 'offer',
      from_address: offererAddress.toLowerCase(),
      price: offerPrice,
      contract_address: CONTRACTS.SakuraNFT,
      token_id: tokenId,
      transaction_hash: receipt.hash,
    });

    return { success: true, offerId };
  } catch (error: any) {
    console.error('Error making offer:', error);
    return { success: false, error: error.message || 'Failed to make offer' };
  }
};

// Accept offer on NFT
export const acceptOffer = async (
  offerId: number,
  tokenId: number,
  offererAddress: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // First approve the offer contract
    const nftContract = await getSakuraNFTContract();
    if (!nftContract) {
      return { success: false, error: 'Failed to connect to NFT contract' };
    }

    const approveTx = await nftContract.approve(CONTRACTS.OfferContract, tokenId);
    await approveTx.wait();

    // Accept offer
    const contract = await getOfferContract();
    if (!contract) {
      return { success: false, error: 'Failed to connect to offer contract' };
    }

    // Accept offer using offerId
    const tx = await contract.acceptOffer(offerId);
    const receipt = await tx.wait();
    
    console.log('Offer accepted successfully:', receipt.hash);

    // Update database
    await supabase
      .from('offers')
      .update({ status: 'accepted' })
      .eq('offer_id', offerId)
      .eq('status', 'pending');

    await supabase
      .from('nfts')
      .update({ owner_address: offererAddress.toLowerCase() })
      .eq('token_id', tokenId)
      .eq('contract_address', CONTRACTS.SakuraNFT);

    // Log to offer_logs
    await supabase.from('offer_logs').insert({
      offer_id: offerId,
      action: 'accept',
      user_address: offererAddress.toLowerCase(),
      token_id: tokenId,
      transaction_hash: receipt.hash,
    });

    // Record activity
    const { data: offer } = await supabase
      .from('offers')
      .select('offer_price')
      .eq('offer_id', offerId)
      .single();

    await supabase.from('activities').insert({
      activity_type: 'offer_accepted',
      to_address: offererAddress.toLowerCase(),
      price: offer?.offer_price || '0',
      contract_address: CONTRACTS.SakuraNFT,
      token_id: tokenId,
      transaction_hash: receipt.hash,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error accepting offer:', error);
    return { success: false, error: error.message || 'Failed to accept offer' };
  }
};

// Cancel offer
export const cancelOffer = async (
  offerId: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const contract = await getOfferContract();
    if (!contract) {
      return { success: false, error: 'Failed to connect to offer contract' };
    }

    // Get offer details for logging
    const { data: offerData } = await supabase
      .from('offers')
      .select('token_id, offerer_address')
      .eq('offer_id', offerId)
      .single();

    const tx = await contract.cancelOffer(offerId);
    const receipt = await tx.wait();

    // Update database
    await supabase
      .from('offers')
      .update({ status: 'cancelled' })
      .eq('offer_id', offerId)
      .eq('status', 'pending');

    // Log to offer_logs
    if (offerData) {
      await supabase.from('offer_logs').insert({
        offer_id: offerId,
        action: 'cancel',
        user_address: offerData.offerer_address.toLowerCase(),
        token_id: offerData.token_id,
        transaction_hash: receipt.hash,
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error cancelling offer:', error);
    return { success: false, error: error.message || 'Failed to cancel offer' };
  }
};

// Transfer NFT
export const transferNFT = async (
  tokenId: number,
  fromAddress: string,
  toAddress: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const contract = await getSakuraNFTContract();
    if (!contract) {
      return { success: false, error: 'Failed to connect to NFT contract' };
    }

    // Transfer using safeTransferFrom
    const tx = await contract['safeTransferFrom(address,address,uint256)'](
      fromAddress,
      toAddress,
      tokenId
    );
    const receipt = await tx.wait();

    // Get NFT details for notification
    const { data: nft } = await supabase
      .from('nfts')
      .select('id, name')
      .eq('token_id', tokenId)
      .eq('contract_address', CONTRACTS.SakuraNFT)
      .single();

    // Update database
    await supabase
      .from('nfts')
      .update({ owner_address: toAddress.toLowerCase() })
      .eq('token_id', tokenId)
      .eq('contract_address', CONTRACTS.SakuraNFT);

    // Record activity
    await supabase.from('activities').insert({
      activity_type: 'transfer',
      from_address: fromAddress.toLowerCase(),
      to_address: toAddress.toLowerCase(),
      contract_address: CONTRACTS.SakuraNFT,
      token_id: tokenId,
      transaction_hash: receipt.hash,
    });

    // Create notification for recipient
    if (nft) {
      await supabase.rpc('create_notification', {
        p_recipient_address: toAddress.toLowerCase(),
        p_sender_address: fromAddress.toLowerCase(),
        p_notification_type: 'transfer',
        p_title: 'NFT Received!',
        p_message: `You received ${nft.name} from ${fromAddress.slice(0, 6)}...${fromAddress.slice(-4)}`,
        p_nft_id: nft.id,
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error transferring NFT:', error);
    return { success: false, error: error.message || 'Failed to transfer NFT' };
  }
};
