const express = require('express')
const router = express.Router()

const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/homework')
const db = mongoose.connection

db.once('open', function () {
    console.log('Connection successful.')
})

const Schema = mongoose.Schema
// const personSchema = new Schema({
//     string:String,
//     length: Number
// })
// const people = mongoose.model('people', personSchema)

const hw2Schema = new Schema({
    input:String,
    length:Number
})

const hw2 = mongoose.model('hw2', hw2Schema)

router.get('/',function (req,res,next) {
    hw2.find({},function (err,results) {
        let Strings = [];

        results.forEach(function (string) {
            Strings.push(string.input);
        })
        res.send(Strings)
    })
})

router.get('/:longstring', function (req,res,next) {
    let input = req.params.longstring

    let length = input.length

    const theStringSchema = new hw2 ({
        input,
        length
    })

    hw2.find({input:input},function (err,results) {
        if (err) {
            throw err
        } else {
            // We don't find it
            if (!results.length) {
                // Save it and return obj to client
                let myobj = {input:input,length:length}
                hw2.create(myobj , function (err,obj) {
                    if (err) {throw err}
                    //console.log(obj)
                    res.json({input:input,length:length})


                })

            } else {
                let obj = {input: input, length: length}

                res.json(obj)
            }
        }
    })

})

router.post('/',function (req,res,next) {
    let input = req.body.input
    let length = input.length
    // Check if string is empty
    if (length == 0) {
        res.send('Please send a valid string')
    } else {
        hw2.findOne({input:input}, function (err,result) {
            if(err) {throw err}
            // If empty
            if (!result) {
                let myobj = {input:input,length:length}
                hw2.create(myobj, function (err, obj) {
                    if (err) {throw err}
                    res.json({input:input,length:length})
                })
            } else { // found it
                res.json({input:input,length:length})
            }

        })
    }
})

router.delete('/:string',function (req,res,next) {
    let input = req.params.string
    hw2.findOne({input:input},function (err,result) {
        if (err) {throw err}
        if (!result) {
            res.send('String not found')
        } else {
            hw2.findOneAndRemove({input:input},function (err,result) {
                if (err) {throw err}
                res.json({success:true})
            })
        }
    })
})



// // POST Create a new user
// router.post('/db', function(req, res, next) {
//     console.log(req.body)
//     // let name = req.body.name
//     // let dept = req.body.department
//     // let UID = req.body.UID
//     const obj = new hw2(
//         req.body
//     )
//
//     //   const aPerson = new people ( {name: name, department: dept, UID: UID})
//     obj.save(function(err) {
//         if (err) {
//             res.send(err)
//         }
//         //send back the new person
//         else {
//             res.send (hw2)
//         }
//     })
//
// })
//
//
// //GET Fetch all users
// router.get('/db', function (req, res, next) {
//     people.find({}, function (err, results) {
//         res.json(results);
//     })
//
// })
//
// //GET Fetch single user, match /users/db/Frank
// router.get('/db/:_name', function (req, res, next) {
//     people.find({name: req.params._name}, function (err, results) {
//         res.json(results)
//     })
// })
//
//
//
// //PUT Update the specified user's name
// router.put('/db/:_id', function (req, res, next) {
//     people.findByIdAndUpdate(req.params._id, req.body, {'upsert': 'true'}, function (err, result) {
//         if (err) {res.json({message: 'Error updating'});}
//         else {console.log('updated'); res.json({message: 'success'})}
//     })
//
// })
//
//
// //DELETE Delete the specified user
// router.delete('/db/:_id', function (req, res, next) {
//     people.findByIdAndRemove(req.params._id, function (err, result) {
//         if(err) {res.json({message: 'Error deleting'});}
//         else {res.json({message: 'success'});}
//     })
// });

module.exports = router;