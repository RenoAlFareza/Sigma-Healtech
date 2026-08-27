/** Domain types owned by shared — leaf layer per FSD (nothing imports shared). */

export type Role =
  | 'ADMIN'
  | 'MANAGER'
  | 'ASSISTANT'
  | 'PHARMACIST'
  | 'REQUESTOR'
  | 'BUYER'
  | 'VIEWER';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  defaultLocationId: string;
  locationIds: string[];
  active: boolean;
  password?: string;
}

export interface Location {
  id: string;
  name: string;
  code: string;
  type: 'WAREHOUSE' | 'DEPOT' | 'WARD' | 'PHARMACY';
}

export interface Product {
  id: string;
  kfaCode: string;
  name: string;
  zatAktif: string;
  kekuatan: string;
  dosageForm: string;
  nie: string;
  manufacturer: string;
  price: number;
  uom: string;
  category: string;
}

/** Inventory stock level per product+location for a specific lot/bin. */
export interface InventoryItem {
  id: string;
  product: Product;
  locationId: string;
  lot: string;
  expiry?: string | null;
  qtyOnHand: number;
  qtyReserved?: number;
  bin: string;
  status: MedicalStatus;
}

export type StockStatusType =
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'STOCKOUT'
  | 'EXPIRING'
  | 'EXPIRED'
  | 'OVERSTOCK';

export type MedicalStatus = StockStatusType;

/** A single movement on a product's stock card (ledger line). */
export interface StockTransaction {
  date: string;
  type: 'IN' | 'OUT' | 'ADJUST' | 'ISSUE' | 'RECEIPT' | 'TRANSFER_OUT' | 'TRANSFER_IN';
  qtyIn?: number;
  qtyOut?: number;
  balance: number;
  user: string;
  reference?: string;
  productId?: string;
  lot?: string;
  locationId?: string;
}

/** Base shape shared by all stock documents (outbound/inbound/transfer). */
export interface StockDocument {
  id: string;
  status: string;
  createdAt: string;
}

export type MovementStatus =
  | 'DRAFT'
  | 'ITEMS'
  | 'PICKING'
  | 'PACKED'
  | 'DISPATCHED'
  | 'RECEIVED';

export interface MovementItem {
  productId: string;
  qty: number;
  lot?: string;
  bin?: string;
}

export interface StockMovement {
  id: string;
  movementNumber: string;
  originId: string;
  destinationId: string;
  type: string;
  status: MovementStatus;
  items: MovementItem[];
  createdAt: string;
}

export interface InboundItem {
  productId: string;
  qtyExpected: number;
  qtyReceived?: number;
  damagedQty?: number;
  lot?: string;
  expiry?: string;
  bin?: string;
}

export type InboundStatus = 'CREATED' | 'RECEIVING' | 'COMPLETED';

export interface InboundReceipt {
  id: string;
  receiptNumber: string;
  sourceType: string;
  referenceId?: string;
  status: InboundStatus;
  items: InboundItem[];
  receivedAt?: string;
  receivedBy?: string;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  originId: string;
  destinationId: string;
  status: 'DRAFT' | 'APPROVED' | 'COMPLETED';
  items: TransferItem[];
  createdAt: string;
}

export interface TransferItem {
  productId: string;
  lot?: string;
  qty: number;
}

export type CycleCountStatus = 'CREATED' | 'IN_PROGRESS' | 'RESOLVING' | 'COMPLETED';

export interface CycleCountItem {
  productId: string;
  lot: string;
  bin: string;
  systemQty: number;
  countedQty?: number;
  variance?: number;
  reasonCode?: string;
}

export interface CycleCount {
  id: string;
  countNumber: string;
  locationId: string;
  status: CycleCountStatus;
  items: CycleCountItem[];
  createdAt: string;
}

export type PurchaseOrderStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'PLACED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED';

export interface PurchaseOrderItem {
  productId: string;
  qty: number;
  unitPrice: number;
  qtyReceived: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  total: number;
  createdAt: string;
}

export type RequisitionPriority = 'RUTIN' | 'URGENT';

export type RequisitionStatus =
  | 'CREATED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PICKING'
  | 'ISSUED'
  | 'RECEIVED'
  | 'CANCELED';

/** A line item within a requisition. */
export interface RequisitionItem {
  productId: string;
  qtyRequested: number;
  qtyApproved?: number;
  qtyIssued?: number;
}

export interface Requisition {
  id: string;
  requestNumber: string;
  originId: string;
  destinationId: string;
  requestedBy: string;
  priority: RequisitionPriority;
  status: RequisitionStatus;
  items: RequisitionItem[];
  createdAt: string;
  reason?: string | null;
}
