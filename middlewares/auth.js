const user=require ("../models/userModel")
const isLogin = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      const userData= await user.findById(req.session.user_id)
      if(userData && !userData.blocked){
        next()
      }else{
        delete req.session.user_id
      res.redirect('/login');

      }
    } else {
      res.redirect('/login');
    }
  
  } catch (error) {
    console.log(error.message);
  }
};





const isLogout =async(req,res,next)=>{
  try{

      if(req.session.user_id){
          res.redirect('/home')
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