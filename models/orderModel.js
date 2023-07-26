
const mongoose = require('mongoose')


const ordersSchema = new mongoose.Schema({
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User"
  },
  date:{
    type:Date,
    require:true
  },
  orderValue:{
    type:Number,
    require:true
  },
  paymentMethod:{
    type:String,
    require:true
  },
  couponDiscount:{
    type:Number,
    default:0
  },
  orderStatus:{
    type:String,
    require:true
  },
  returnReason:{
    type:String,
    require:true
   } ,

   // timestamps: {
        //   require:true
        //  }
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Product"
      },
      quantity: {
        type: Number,
        required: true,
        default: 1
      },
      total:{
        type:Number,
        default:0
      },
     
        

    }
  ],
  addressDetails: {
    
      name: {
        type:String,
        require:true
      
      },
      mobile:{
        type:String,
        require:true
      },
      address:{
        type:String,
        require:true
      },
      city:{
        type:String,
        require:true
      },
      state:{
        type:String,
        require:true
      },
      pincode:{
        type:String,
        require:true
      }

},
  
  cancellationStatus:{
    type:String,
    default:"Not requested"
    
  },
  cancelledOrder:{
    type:Boolean,
    default:false
  },
 
   // Other order properties
  // orderStatus: String,
 
  // Add a new field to store the return reason
 
} )


// module.exports = Order;




module.exports = mongoose.model('Order',ordersSchema )