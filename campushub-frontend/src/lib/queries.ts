import { gql } from '@apollo/client';

// Auth
export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) { token user { id firstName lastName email phone accountStatus profilePictureUrl } }
  }
`;

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) { token user { id firstName lastName email phone accountStatus } }
  }
`;

export const ME = gql`
  query Me { me { id firstName lastName email phone accountStatus profilePictureUrl lastLogin createdAt } }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) { success message user { id firstName lastName email phone profilePictureUrl } }
  }
`;

// Cafes & Menu
export const GET_CAFES = gql`
  query GetCafes { cafes { id name description location status logoUrl createdAt } }
`;

export const GET_CAFE = gql`
  query GetCafe($id: ID!) { cafe(id: $id) { id name description location status logoUrl } }
`;

export const GET_MENU_ITEMS = gql`
  query GetMenuItems($cafeId: ID, $categoryId: ID, $isAvailable: Boolean) {
    menuItems(cafeId: $cafeId, categoryId: $categoryId, isAvailable: $isAvailable) {
      id cafeId categoryId name description price imageUrl isAvailable createdAt
    }
  }
`;

// Restaurants & Food
export const GET_RESTAURANTS = gql`
  query GetRestaurants { restaurants { id name description address phone deliveryFee isActive rating logoUrl } }
`;

export const GET_FOOD_ITEMS = gql`
  query GetFoodItems($restaurantId: ID, $category: String, $isAvailable: Boolean) {
    foodItems(restaurantId: $restaurantId, category: $category, isAvailable: $isAvailable) {
      id restaurantId name description price discountPrice isAvailable category imageUrl preparationTime
    }
  }
`;

// Orders
export const CREATE_FOOD_ORDER = gql`
  mutation CreateFoodOrder($input: CreateFoodOrderInput!) {
    createFoodOrder(input: $input) { success message order { id orderStatus totalAmount createdAt } }
  }
`;

export const GET_FOOD_ORDERS = gql`
  query GetFoodOrders($status: String) {
    foodOrders(status: $status) { id studentId cafeId orderStatus fulfillmentMethod totalAmount specialInstructions createdAt }
  }
`;

export const MY_ORDERS = gql`
  query MyOrders { myOrders { id orderNumber userId restaurantId items totalAmount deliveryAddress status createdAt } }
`;

// Products / Marketplace
export const GET_PRODUCTS = gql`
  query GetProducts($search: String, $minPrice: Float, $maxPrice: Float, $status: String) {
    products(search: $search, minPrice: $minPrice, maxPrice: $maxPrice, status: $status) {
      id sellerId title description price stockQuantity status condition imageUrl createdAt
    }
  }
`;

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) { success message product { id title price imageUrl } }
  }
`;

// Messaging
export const MY_CONVERSATIONS = gql`
  query MyConversations { myConversations { id createdAt updatedAt } }
`;

export const CONVERSATION_MESSAGES = gql`
  query ConversationMessages($conversationId: ID!, $limit: Int, $offset: Int) {
    conversationMessages(conversationId: $conversationId, limit: $limit, offset: $offset) {
      id conversationId senderId messageText messageStatus sentAt
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($conversationId: ID!, $content: String!) {
    sendMessage(conversationId: $conversationId, content: $content) { id conversationId senderId messageText sentAt }
  }
`;

export const UNREAD_COUNT = gql`
  query UnreadCount { unreadMessageCount }
`;

// Payments
export const MY_PAYMENTS = gql`
  query MyPayments { myPayments { id payerId amount paymentMethod paymentStatus transactionReference paidAt createdAt } }
`;

export const INITIATE_PAYMENT = gql`
  mutation InitiatePayment($input: InitiatePaymentInput!) {
    initiatePayment(input: $input) { id amount paymentMethod paymentStatus transactionReference }
  }
`;

// Delivery
export const MY_DELIVERIES = gql`
  query MyDeliveries { myDeliveries { id orderId deliveryPersonId status pickupLocation deliveryLocation assignedAt pickedUpAt deliveredAt } }
`;

export const PENDING_DELIVERIES = gql`
  query PendingDeliveries { pendingDeliveries { id orderId status pickupLocation deliveryLocation assignedAt } }
`;

// Services
export const GET_SERVICES = gql`
  query GetServices($category: String) { services(category: $category) { id providerId title description price category status rating createdAt } }
`;

export const CREATE_SERVICE = gql`
  mutation CreateService($title: String!, $description: String, $price: Float!, $category: String!) {
    createService(title: $title, description: $description, price: $price, category: $category) {
      id title description price category status
    }
  }
`;

// OCR
export const VERIFICATION_STATUS = gql`
  query VerificationStatus { verificationStatus { status studentId university department verifiedAt message } }
`;

export const VERIFY_STUDENT_ID = gql`
  mutation VerifyStudentId($imageUrl: String!) {
    verifyStudentId(imageUrl: $imageUrl) { isValid studentId university department status message }
  }
`;

export const GET_USERS = gql`
  query GetUsers { users { id firstName lastName email phone accountStatus createdAt } }
`;
