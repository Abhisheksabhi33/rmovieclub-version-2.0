
const Actor =  require('../models/actor');
const { sendError, uploadimageToCloud, formatActor} = require('../utils/helper');
const {isValidObjectId} = require('mongoose');
const cloudinary = require('../cloud');




// exports.createActor = async (req, res) => {
//      const {name, about, gender} = req.body;
     
//      const {file} =  req;

//      const newActor = new Actor ({name, about, gender});
//    const uploadRes = await cloudinary.uploader.upload(file.path);

//      console.log(uploadRes);
//      res.send('ok');


// };

// write above createActor using try catch block
 
exports.createActor = async (req, res) => {  

     try {
          const {name, about, gender} = req.body;
     
          const {file} =  req;

          const newActor = new Actor ({name, about, gender});

         
          if(file){

               const {url, public_id } = await uploadimageToCloud(file.path);
              newActor.avatar = {url, public_id};
          }

           await newActor.save();
           res.status(201).json({actor:formatActor(newActor)});

     } catch (error) {
          sendError(res, 500, 'Internal server error');
     }
}


// update
// things to consider while updating
// 1. image file is / avatar is also updating
// 2. if yes then delete the old image before uploading new image / avatar

exports.updateActor = async (req, res) => {
      const {name, about, gender} = req.body;
          const {file} = req;
          const {actorId} = req.params;

          if(!isValidObjectId(actorId)){
               return sendError(res, 400, 'Invalid actor id');
          }

          const actor  = await Actor.findById(actorId);

          if(!actor){
               return sendError(res, 404, 'Actor not found');
          }

          const public_id = actor.avatar?.public_id;

        // remove old image if there was one   
          if(public_id && file){
             const {result} =   await cloudinary.uploader.destroy(public_id);
             if(result !== 'ok'){
                  return sendError(res, 500, 'Error deleting image');
             }
          }

          // upload new avatar/image if there is one
          if(file){
               const {url, public_id } = await uploadimageToCloud(file.path);
               actor.avatar = {url, public_id};
          }

          actor.name = name;
          actor.about = about;
          actor.gender = gender;

          await actor.save();

          res.status(201).json({actor:formatActor(actor)});


};

// delete

exports.removeActor = async (req, res) => {
      const {actorId} = req.params;

          if(!isValidObjectId(actorId)){
               return sendError(res, 400, 'Invalid actor id');
          }

         const actor =   await Actor.findById(actorId);
          if(!actor){
               return sendError(res, 404, 'Actor not found');
          }

              const public_id = actor.avatar?.public_id;
              
                 if(public_id){
                const {result} =   await cloudinary.uploader.destroy(public_id);
                    if(result !== 'ok'){
                         return sendError(res, 'Error deleting image');
                    }
                }

          await Actor.findByIdAndDelete(actorId);

          res.status(200).json({message: 'Actor deleted successfully'});
              
};

// search actor

exports.searchActor = async (req, res) => {
     const {name} = req.query;
     // const result = await Actor.find({$text: {$search: `"${query.name}"`}});
     if(!name.trim()) return sendError(res, 'Invalid request');
     const result = await Actor.find({name: {$regex: name, $options: 'i'} });

     const actors = result.map(actor => formatActor(actor));

     res.status(200).json({results: actors});
};


// get latest actors

exports.getLatestActors = async (req, res) => {

    const result = await Actor.find().sort({createdAt: "-1"}).limit(12);
    const actors = result.map(actor => formatActor(actor));

    res.status(200).json(actors);
};

exports.getSingleActor = async (req, res) => {
      const {id} = req.params;

          if(!isValidObjectId(id)){
               return sendError(res, 400, 'Invalid actor id');
          }

          const actor = await Actor.findById(id);
          if(!actor){
               return sendError(res, 404, 'Actor not found');
          }

          res.status(200).json({actor: formatActor(actor)});
};

exports.getActors = async (req, res) =>{
      const {pageNo, limit} = req.query;

   const actors =   await Actor.find({})
      .sort({createdAt: -1})
      .skip(parseInt(pageNo) * parseInt(limit))
      .limit(parseInt(limit));

          const profiles = actors.map((actor) => formatActor(actor));
                      
          res.json({profiles});
};

     
        
        

     