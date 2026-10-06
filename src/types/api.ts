// Types for the Evinn Server API. Mirrors section 9 of docs/API.md.

export type ObjectId = string;
export type ISODate = string;

export interface ApiErrorResponse {
  message: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface Admin {
  _id: ObjectId;
  fullName: string;
  email: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Brand {
  _id: ObjectId;
  displayName: string;
  logoUrl: string;
  logoPublicId: string;
  origin: string;
  established: string;
  headquarters: string;
  about: string;
  websiteUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  facebookUrl: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type BrandSummary = Pick<Brand, "_id" | "displayName" | "logoUrl">;

export type BikeType = "bike" | "scooter";

export interface BikeSpecs {
  range: string;
  topSpeed: string;
  battery: string;
  chargingTime: string;
  motorPower: string;
  weight: string;
  warranty: string;
}

export interface Bike {
  _id: ObjectId;
  name: string;
  slug: string;
  brand: BrandSummary;
  type: BikeType;
  price: number;
  rating: number;
  imageUrl: string;
  imagePublicId: string;
  specs: BikeSpecs;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type BikeSummary = Pick<Bike, "_id" | "name" | "slug" | "imageUrl">;

export interface Accessory {
  _id: ObjectId;
  name: string;
  slug: string;
  price: number;
  priceText: string;
  imageUrl: string;
  imagePublicId: string;
  description: string;
  features: string[];
  inStock: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type SparePart = Accessory;

/** Accessories and spare parts share one shape; this is the common name used by the UI. */
export type StoreItem = Accessory;

export type ContactReason =
  | "Product Inquiry"
  | "Business Inquiry"
  | "Support"
  | "General Inquiry";

export type ContactStatus = "pending" | "in process" | "answered";

export interface ContactSubmission {
  _id: ObjectId;
  fullName: string;
  email: string;
  reason: ContactReason;
  message: string;
  status: ContactStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type TestRideStatus = "pending" | "accepted" | "rejected";

export interface TestRideRequest {
  _id: ObjectId;
  requesterName: string;
  requesterEmail: string;
  requesterWhatsApp: string;
  brand: BrandSummary | null;
  bike: BikeSummary | null;
  preferredCity: string;
  preferredDate: ISODate;
  preferredTime: string;
  status: TestRideStatus;
  rejectionReason: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "delivered"
  | "completed"
  | "cancelled"
  | "rejected";

export type PaymentMethod = "cash on delivery";

export interface ShippingAddress {
  fullName: string;
  phoneNumber: string;
  address: string;
  postalCode: string;
  city: string;
}

export interface Order {
  _id: ObjectId;
  bike: BikeSummary | null;
  bikeName: string;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  nextStatuses: OrderStatus[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

// Responses

export interface LoginResponse {
  accessToken: string;
  admin: Admin;
}

export interface MeResponse {
  admin: Admin;
}

export interface MessageResponse {
  message: string;
}

export interface BrandListResponse {
  brands: Brand[];
}

export interface BrandResponse {
  brand: Brand;
}

export interface BikeListResponse {
  bikes: Bike[];
  pagination: Pagination;
}

export interface BikeResponse {
  bike: Bike;
}

export interface AccessoryListResponse {
  accessories: Accessory[];
  pagination: Pagination;
}

export interface AccessoryResponse {
  accessory: Accessory;
}

export interface SparePartListResponse {
  spareParts: SparePart[];
  pagination: Pagination;
}

export interface SparePartResponse {
  sparePart: SparePart;
}

export interface ContactSubmissionListResponse {
  submissions: ContactSubmission[];
  pagination: Pagination;
}

export interface ContactSubmissionResponse {
  submission: ContactSubmission;
}

export interface TestRideRequestListResponse {
  testRideRequests: TestRideRequest[];
  pagination: Pagination;
}

export interface TestRideRequestResponse {
  testRideRequest: TestRideRequest;
}

export interface OrderListResponse {
  orders: Order[];
  pagination: Pagination;
}

export interface OrderResponse {
  order: Order;
}

// Query params

export interface PageQuery {
  page?: number;
  limit?: number;
}

export interface BikeListQuery extends PageQuery {
  brand?: ObjectId;
  type?: BikeType;
}

export interface AccessoryListQuery extends PageQuery {
  inStock?: boolean;
}

export type SparePartListQuery = AccessoryListQuery;
export type StoreItemListQuery = AccessoryListQuery;

export interface ContactSubmissionListQuery extends PageQuery {
  status?: ContactStatus;
  reason?: ContactReason;
}

export interface TestRideRequestListQuery extends PageQuery {
  status?: TestRideStatus;
  brand?: ObjectId;
  bike?: ObjectId;
}

export interface OrderListQuery extends PageQuery {
  status?: OrderStatus;
  bike?: ObjectId;
}

// Request bodies

export type BrandInput = Partial<
  Pick<
    Brand,
    | "displayName"
    | "origin"
    | "established"
    | "headquarters"
    | "about"
    | "websiteUrl"
    | "instagramUrl"
    | "twitterUrl"
    | "facebookUrl"
  >
>;

export interface BikeInput {
  name?: string;
  slug?: string;
  brand?: ObjectId;
  type?: BikeType;
  price?: number;
  rating?: number;
  specs?: Partial<BikeSpecs>;
}

export interface AccessoryInput {
  name?: string;
  slug?: string;
  price?: number;
  description?: string;
  features?: string[];
  inStock?: boolean;
}

export type SparePartInput = AccessoryInput;
