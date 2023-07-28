
const User = require("../models/userModel")
const bcrypt=require('bcrypt')
const Product=require("../models/productModel")


const fs = require('fs')
//multer
const multer = require("multer");
const path = require("path");
const express = require("express");
const router = express.Router();

const { userLogout } = require("./userController");

const Category = require("../models/categoryModel");
const { log } = require("handlebars/runtime");
const Order = require('../models/orderModel')
const moment = require("moment-timezone")
const mongoose=require("mongoose")
const sharp = require('sharp');


// var multer = require("multer");
// const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const uploads = multer({ storage: storage });


const ObjectId = mongoose.Types.ObjectId;
const categoryHelpers=require("../helpers/categoryHelpers")
const Wallet = require("../models/walletModel")
const adminHelpers = require("../helpers/adminHelpers")

const sizeOf = require('image-size'); // Import the image-size library





const loadLogin =async(req,res)=>{
    try{

        res.render('admin/login')
    }catch(error){
        console.log(error.message);
        res.redirect('/error')

    }
}

const verifyLogin = async(req,res)=>{
    try{
       const email=req.body.email
       const password= req.body.password

        const userData=await User.findOne({email:email})
        console.log(userData);
        if(userData){
            const passwordMatch= await bcrypt.compare(password,userData.password)
             
              if(passwordMatch){
                  if(userData.is_admin===0){
                    res.render('admin/login',{
                      message:"You Do Not Have Acess"
                    })
                  }else{
                  
                    req.session.adminId=userData._id
                    req.session.admin_data=userData.is_admin
                    console.log(req.session.adminId);
                     res.redirect('/admin/home')
                  }
              }
        }else{
            res.render('admin/login',{
              message:"Email and Password Don't Match"

            })
        }
    }catch(error){
        console.log(error.message);
        res.redirect('/error')

    }
}


// const loadDashboard=async(req,res)=>{
//     try{


//         User.findById({_id:req.session.user_id})
//      res.render('admin/home')
//     }catch(error){
//      console.log(error.message);
//     }
// }


const loadDashboard = async (req, res) => {
  try {

    User.findById({_id:req.session.user_id})
    const dashBoardDetails = await adminHelpers.loadingDashboard(req, res)

    const orderDetails = await adminHelpers.OrdersList(req,res)

    const totalUser = dashBoardDetails.totaluser;
    const totalSales = dashBoardDetails.totalSales;
    const salesbymonth = dashBoardDetails.salesbymonth
    const paymentMethod = dashBoardDetails.paymentMethod;
    const yearSales = dashBoardDetails.yearSales
    const todaySales = dashBoardDetails.todaySales
   
   let sales=encodeURIComponent(JSON.stringify(salesbymonth))

  //  console.log(sales,'sales');

    res.render('admin/home', { totalUser,todaySales:todaySales[0] ,totalSales:totalSales[0], salesbymonth:encodeURIComponent(JSON.stringify(salesbymonth)) ,paymentMethod:encodeURIComponent(JSON.stringify(paymentMethod)),yearSales:yearSales[0],orderDetails:orderDetails })
  } catch (error) {
    console.log(error.message)
    res.redirect('/error')
  }
}





const adminLogout = async(req,res)=>{
    try{
      delete req.session.adminId
      delete req.session.admin_data
       res.redirect('admin')
    }catch(error){
      console.log(error.message);
      res.redirect('/error')

    }
  }

  const loadProducts = async (req, res) => {
    try {
      const updateProducts = await Product.find().lean();
      const productWithSerialNumber = updateProducts.map((products, index) => ({
        ...products,serialNumber: index + 1,
      }));
      const categories = await Category.find().lean();
      res.render("admin/add-products", {
        
        products: productWithSerialNumber,
        categories: categories,

      });
    } catch (error) {
      console.log(error.message);
      res.redirect('/error')

    }
  };
  




const insertProducts = async (req, res) => {
  try {
    var arrayImage = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const croppedImage = `cropped_${file.filename}`;

      await sharp(file.path)
        .resize(500, 600, { fit: 'cover' })
        
         .toFile(`./public/uploads/${croppedImage}`);

      arrayImage.push(croppedImage);
    }

    const newProduct = new Product({
      brand: req.body.brand,
      productname: req.body.productname,
      category: req.body.category,
      price: req.body.price,
      images: arrayImage, // Use the cropped image names
      inStock: req.body.stock,
      description: req.body.description,
    });

    const addProductData = await newProduct.save();
    console.log(addProductData);
    if (addProductData) {
      await Category.updateOne(
        {
          category: req.body.category,
        },
        {
          $push: { products: newProduct._id },
        }
      );
      const updateProducts = await Product.find().lean();
      const productWithSerialNumber = updateProducts.map((products, index) => ({
        ...products,
        serialNumber: index + 1,
      }));
      const categories = await Category.find().lean();
      res.render('admin/add-products', {
        products: productWithSerialNumber,
        categories: categories,
      });
    }
  } catch (error) {
    console.log(error);
    res.redirect('/error')

  }
};

     





      const editProduct = async (req, res) => {
        try {
          const id = req.query.id;
      
          const categories = await Category.find({ unlist: false }).lean();
          const categoryData = {};
          categories.forEach((data) => {
            categoryData[data._id.toString()] = {
              _id: data._id.toString(),
              category: data.category,
            };
          });
          console.log(categoryData, "category data");
          const categoryLookup = [];
          categories.forEach((category) => {
            categoryLookup[category._id.toString()] = category.category;
          });
      
          const updatedProduct = await Product.findById(id).lean();
          // console.log(lookupCategory(updatedProduct.category), "lookupCategory");
      
          if (updatedProduct) {
            const productWithCategoryName = {
              ...updatedProduct,
              category: updatedProduct.category,
            };
      
            res.render("admin/edit-product", {
              product: productWithCategoryName,
             
              categories: categoryData,
            });
          } else {
            console.log("Product not found");
            res.redirect("/admin/products");
          }
        } catch (error) {
          // throw new Error(error.message);
          res.redirect('/error')

        }
      };
      








// const deleteimg = async (req, res) => {
//   try {
//     const { imgName, productId } = req.body;
//     console.log(req.body);
//     console.log(productId);
//     const isValidObjectId = mongoose.Types.ObjectId.isValid(productId);
//     console.log(isValidObjectId);

//     if (!isValidObjectId) {
//       return res.status(400).json({ success: false, error: 'Invalid product ID.' });
//     }

//     const product = await Product.findById(productId);

//     if (!product) {
//       return res.status(404).json({ success: false, error: 'Product not found.' });
//     }

//     console.log(product);

//     // Find the index of the image with the specified imgName
//     const imageIndex = product.images.findIndex((image) => image === imgName);

//     // If the image exists, remove it from the images array
//     if (imageIndex !== -1) {
//       product.images.splice(imageIndex, 1);
//       await product.save();
//       console.log('Image removed successfully');
//     } else {
//       console.log('Image not found');
//     }

//     res.status(200).json({ success: true, message: 'Image deleted successfully.' });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ success: false, error: 'Image deletion failed.' });
//   }
// };







const updateProduct = async (req, res) => {
  try {
    const id = req.params.id;


    const product = await Product.findById(id).lean();


    let updatedProductData = {
      brand: req.body.brand,
      productname: req.body.productname,
      inStock: req.body.stock,
      price: req.body.price,
      description: req.body.description,
      category: req.body.category,
      images: req.files,
    };

    // If new images are uploaded, process and resize them before updating
    if (req.files && req.files.length > 0) {
      let croppedImages = [];
      for (let file of req.files) {
        const croppedImage = `cropped_${file.filename}`;

        await sharp(file.path)
          .resize(500, 600, { fit: 'cover' })
          .toFile(`./public/uploads/${croppedImage}`);


        croppedImages.push(croppedImage);

        // Remove the original file after processing
        fs.unlinkSync(file.path);
      }
      updatedProductData.images = croppedImages;
    }

    const product1 = await Product.findByIdAndUpdate(
      id,
      { $set: updatedProductData },
      { new: true }
    );

    res.redirect('/admin/add-products');
  } catch (error) {
    // throw new Error(error.message);
    res.redirect('/error')

  }
};






const unlistProducts = async (req, res) => {
  try {
    const id = req.query.id;
    const ProductData = await Product.findByIdAndUpdate(
      id,
      { $set: { unlist: true } }
    );
    res.redirect("/admin/add-products");
  } catch (error) {
    console.log(error.message);
    res.redirect('/error')

  }
};

const listProducts = async (req, res) => {
  try {
    const id = req.query.id;
    const ProductData = await Product.findByIdAndUpdate(
      id,
      { $set: { unlist: false } }
    );
    res.redirect("/admin/add-products");
  } catch (error) {
    console.log(error.message);
    res.redirect('/error')

  }
};










  
  const loadCategory = async (req, res) => {
    try {
      const updatedcategory = await Category.find().lean();
      const categoryWithSerialNumber = updatedcategory.map((category, index) => ({
        ...category,
        serialNumber: index + 1,
      }));
      res.render("admin/category", {
        category: categoryWithSerialNumber,
      });
    } catch (error) {
      console.log(error.message);
      res.redirect('/error')

    }
  };
  
  const addCategory = async (req, res) => {
    try {
      const category = req.body.category.toUpperCase();
  
      const existingCategory = await Category.findOne({
        category: { $regex: new RegExp("^" + category + "$", "i") },
      });
      if (existingCategory) {
        const errorMessage = "category already exits";
        const updatedcategory = await Category.find().lean();
        const categoryWithSerialNumber = updatedcategory.map(
          (category, index) => ({
            ...category,
            serialNumber: index + 1,
          })
        );
  
        return res.render("admin/category", {
          category: categoryWithSerialNumber,
          error: errorMessage,
        });
      }
      const newCategory = new Category({
        category: category,
      });
      const categories = await newCategory.save();
      return res.redirect("/admin/category");
    } catch (error) {
      console.log(error.message);
      res.redirect('/error')

    }
  };
 
  
  const editCategoryLoad = async(req,res)=>{
    try {
      await categoryHelpers.editingCategoryPageLoad(req,res)
    } catch (error) {
      console.log(error.message)
          res.redirect('/error')
    }
  }
  
  const updateCategory = async(req,res)=>{
    try {
      await categoryHelpers.updatingCategory(req,res);
    } catch (error) {
      console.log(error.message)
      res.redirect('/error')
    }
  }








  //add user
  const addUser = async (req, res) => {
    const userData = await User.find({ is_admin: 0 }).lean();
    // console.log(userData);
    const usersWithSerialNumber = userData.map((users, index) => ({
      ...users,
      serialNumber: index + 1,
    }));
    res.render("admin/user", {
      user: usersWithSerialNumber,
    });
  };




  




const blockedUserlist = async (req, res) => {
  try {
    const userData = await User.find({ blocked: true }).lean();
    const usersWithSerialNumber = userData.map((blockUser, index) => ({
      ...blockUser,
      serialNumber: index + 1,
    }));
    res.render("admin/blockeduserlist", {
     
      user: usersWithSerialNumber,
    });
  } catch (error) {
    console.log(error.message);
    res.redirect('/error')

  }
};




const unblockUser = async (req, res) => {
  try {
    const id = req.query.id;
    // console.log(id, "id");
    const userData = await User.findByIdAndUpdate(
      { _id: id },
      { $set: { blocked: false } }
    );
    res.redirect("/admin/unblockUser");
  } catch (error) {
    console.log(error.message);
    res.redirect('/error')

  }
};


const blockedUsers= async (req, res) => {
  try {
      const blockedUserData = await User.find({ is_admin: false, blocked: true }).lean();
      const usersWithSerialNumber = blockedUserData.map((user, index) => ({
          ...user,
          serialNumber: index + 1
      }));
      console.log(usersWithSerialNumber);
      res.render('admin/blocked-users', { users: usersWithSerialNumber });
  } catch (error) {
      // throw new Error(error.message);
      res.redirect('/error')

  }
}

const blockUser = async (req, res) => {
  try {
    const id = req.query.id;
  
    const userData = await User.findByIdAndUpdate(
      { _id: id },
      { $set: { blocked: true } }
    );
    
    res.redirect("/admin/user");
  } catch (error) {
    console.log(error.message);
    res.redirect('/error')

  }
};




const getUserOrders = async (req, res) => {
  try {
 
    const orderData = await Order.find().populate("userId").lean();
    const orderHistory = orderData.map((history) => {
      let createdOnIST = moment(history.date)
        .tz("Asia/Kolkata")
        .format("DD-MM-YYYY h:mm A");

      return { ...history, date: createdOnIST, username: history.userId.name };
    });
    res.render("admin/userOrders", {
      
      orderData: orderHistory,
    });
  } catch (error) {
    console.log(error.message);
    res.redirect('/error')

  }
};


const loadOrdersView=async(req,res)=>{
  try {
      const orderId = req.query.id;
     

      const order = await Order.findOne({ _id: orderId })
          .populate({
              path: 'products.productId',
              select: 'productname price images',
          })


      const createdOnIST = moment(order.date).tz('Asia/Kolkata').format('DD-MM-YYYY h:mm A');
      order.date = createdOnIST;

      const orderDetails = order.products.map(product => {
          const images = product.productId.images || []; // Set images to an empty array if it is undefined
          const image = images.length > 0 ? images[0] : ''; // Take the first image from the array if it exists
    
          return {
              name: product.productId.name,
              image: images,
              price: product.productId.price,
              total: product.total,
              quantity: product.quantity,
              status:order.orderStatus
          };
      });

      const deliveryAddress = {
          name: order.addressDetails.name,
         address: order.addressDetails.address,
          city: order.addressDetails.city,
          state: order.addressDetails.state,
          pincode: order.addressDetails.pincode,

      };



      const subtotal = order.orderValue;
      const cancellationStatus = order.cancellationStatus


 
      res.render('admin/userOrderView', {
          orderDetails: orderDetails,
          deliveryAddress: deliveryAddress,
          subtotal: subtotal, 
          orderId: orderId,
          orderDate: createdOnIST,
           cancellationStatus:cancellationStatus,
      });
  } catch (error) {
      // throw new Error(error.message);
      res.redirect('/error')

  }
}


const cancelledByAdmin = async (req, res) => {
  try {
    const id = req.body.orderId;
    

    const url = '/admin/ordersView?id=' + id;
    console.log(url, 'url');

    const updateOrder = await Order.findByIdAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { cancellationStatus: "cancelled", orderStatus: "cancelled" } },
      { new: true }
    ).exec();


    

    const wallet = await Wallet.findOne({ userId: updateOrder.userId }).exec();

    if (wallet) {
      const updatedWallet = await Wallet.findOneAndUpdate(
        { userId: updateOrder.userId },
        { $inc: { walletAmount: updateOrder.orderValue } },
        { new: true }
      ).exec();
    } else {
      const newWallet = new Wallet({
        userId: updateOrder.userId,
        walletAmount: updateOrder.orderValue,
      });
      const createdWallet = await newWallet.save();
    }

                 //stock updation in admin side 

     // Retrieve the products in the order
      const productsInOrder = updateOrder.products;

     // Iterate over the products and add them back to the stock
    for (const product of productsInOrder) {
    const productId = product.productId;
    const quantity = product.quantity;

    await Product.findByIdAndUpdate(productId, { $inc: { inStock: quantity } });
  }

    res.redirect(url);
  } catch (error) {
    console.log(error.message);
    res.redirect('/error')

  }
};




const rejectCancellation = async (req, res) => {
  try {
    const orderId = req.body.orderId;

    const updateOrder = await Order.findByIdAndUpdate(
      { _id: new ObjectId(orderId) },
      { $set: { orderStatus: "Placed", cancellationStatus: "Not requested" } },
      { new: true }
    ).exec();


    const url = '/admin/ordersView?id=' + orderId;
    
    res.redirect(url);
  } catch (error) {
    console.log(error.message);
    res.redirect('/error')

  }
};






//form other side 


const productDelevery = async (req, res) => {
  try {
    const orderId = req.body.orderId;

    const updateOrder = await Order.findByIdAndUpdate(
      { _id: new ObjectId(orderId) },
      { $set: { orderStatus: "Shipped", cancellationStatus: "Shipped" } },
      { new: true }
    ).exec();


    const url = '/admin/ordersView?id=' + orderId;
    
    res.redirect(url);
  } catch (error) {
    console.log(error.message);
    res.redirect('/error')

  }
};


const deliveredProduct = async (req, res) => {
  try {
    const orderId = req.body.orderId;

    const updateOrder = await Order.findByIdAndUpdate(
      { _id: new ObjectId(orderId) },
      { $set: { orderStatus: "Delivered", cancellationStatus: "Delivered" } },
      { new: true }
    ).exec();


    const url = '/admin/ordersView?id=' + orderId;
    
    res.redirect(url);
  } catch (error) {
    console.log(error.message);
    res.redirect('/error')

  }
};



const returnOrder = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const returnReason = req.body.returnReason; // Get the return reason from the request body
    const url = "/admin/ordersView?id=" + orderId;

    const updateData = {
      $set: {
        orderStatus: "Returned",
        cancellationStatus: "Returned",
        returnOrder: true,
      },
    };

    if (returnReason === "damaged") {
      // If the return reason is "damaged," remove the returnOrder key from the update data
      delete updateData.$set.returnOrder;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      { _id: new ObjectId(orderId) },
      updateData,
      { new: true }
    ).exec();

    const wallet = await Wallet.findOne({ userId: updatedOrder.userId }).exec();

    if (wallet) {
      const updatedWallet = await Wallet.findOneAndUpdate(
        { userId: updatedOrder.userId },
        { $inc: { walletAmount: updatedOrder.orderValue } },
        { new: true }
      ).exec();
    } else {
      const newWallet = new Wallet({
        userId: updatedOrder.userId,
        walletAmount: updatedOrder.orderValue,
      });
      const createdWallet = await newWallet.save();
    }

    // Stock updation only when return reason is not "damaged"
    if (returnReason !== "damaged") {
      const productsInOrder = updatedOrder.products;
      // Iterate over the products and add them back to the stock
      for (const product of productsInOrder) {
        const productId = product.productId;
        const quantity = product.quantity;
        await Product.findByIdAndUpdate(productId, { $inc: { inStock: quantity } });
      }
    }

    res.redirect(url);
  } catch (error) {
    console.log(error.message);
    res.redirect('/error')

  }
};



const salesReportPage = async(req,res)=>{
  try {
    const orderSuccessDetails = await adminHelpers.orderSuccess()
    
  
    res.render("admin/sales-report-page", { order:orderSuccessDetails.orderHistory, total:orderSuccessDetails.total });
  } catch (error) {
     console.log(error.message)
    res.render('admin/errorPage')
  }
}

const salesofToday = async(req,res)=>{
  try {
    const todaySales = await adminHelpers.salesToday()
    res.render("admin/sales-report-page", { order:todaySales.orderHistory, total:todaySales.total });
  } catch (error) {
    console.log(error.message)
        res.redirect('/error')
  }
}

const getWeekSales = async(req,res)=>{
  try {
    const weeklySales = await adminHelpers.weeklySales()

     res.render("admin/sales-report-page", { order:weeklySales.orderHistory, total:weeklySales.total });
  } catch (error) {
    console.log(error.message)
        res.redirect('/error')
  }
}

const getMonthSales = async(req,res)=>{
  try {
    const montlySales = await adminHelpers.monthlySales()
    res.render("admin/sales-report-page", { order:montlySales.orderHistory, total:montlySales.total });
  } catch (error) {
    console.log(error.message)
        res.redirect('/error')
  }
}

const getYearlySales = async(req,res)=>{
  try {
    const yearlySales = await adminHelpers.yearlySales()
    res.render("admin/sales-report-page", { order:yearlySales.orderHistory, total:yearlySales.total });
  } catch (error) {
    console.log(error.message)
        res.redirect('/error')
  }
}

const salesWithDate = async(req,res)=>{
  try {
    const salesWithDate = await adminHelpers.salesWithDate(req,res)
    res.render("admin/sales-report-page", { order:salesWithDate.orderHistory, total:salesWithDate.total });
  } catch (error) {
    console.log(error.message,'salesWithDate controller error')
        res.redirect('/error')
  }
}

const downloadSalesReport = async(req,res)=>{
  try {
    const salesPdf = await adminHelpers.salesPdf(req,res)
  } catch (error) {
    console.log(error.message,'pdfSales controller error')
        res.redirect('/error')
  }
}






module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    adminLogout,
    

    loadProducts,
    insertProducts,
    loadCategory,
    addCategory,
    editCategoryLoad,
    updateCategory,
    loadProducts,
    
     addUser,
    
     blockUser,
     blockedUserlist,
     unblockUser,
     blockedUsers,

     editProduct,
     updateProduct,
     unlistProducts,
     listProducts,

     getUserOrders,
     loadOrdersView,
     cancelledByAdmin,
     rejectCancellation,
     productDelevery,
     deliveredProduct,
     returnOrder,

     salesReportPage,
     salesofToday,
     getWeekSales,
     getMonthSales,
     getYearlySales,
     salesWithDate,
     downloadSalesReport,
   
    

}