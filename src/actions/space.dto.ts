export interface MerchantSpaceData {
  id: string;
  username: string;
  name: string;
  image: string | null;
  preferredCommunicationChannel: string; // Or your specific CommunicationChannel enum
  tel: string | null;
  productCount: number;
}
