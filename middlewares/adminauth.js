const isLogin =async(req,res,next)=>{
    try{
 
     if(req.session.adminId&& req.session.admin_data=== 1){
        next();
      }  else{
        res.redirect('admin')    
     }
    
    }catch(error){
     console.log(error.message)
    } 
 }
 
 
 
 const isLogout =async(req,res,next)=>{
     try{
 
         
         if(req.session.adminId&& req.session.admin_data=== 1){
             res.redirect('home')
         }
         next()
    
     }catch(error){
    console.log(error.message)
     } 
  }
 
  module.exports={
     isLogin,
     isLogout,
    
  }