
export interface OrderItem {
  name: string;
  quantity: number;
}

export interface ShippingInfo {
  recipient: string;
  address: string;
}

export interface ExtractedData {
  orderTitle: string;
  items: OrderItem[];
  deliveryDate: string;
  shippingInfo: ShippingInfo;
}
