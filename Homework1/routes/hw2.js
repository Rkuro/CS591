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



module.exports = router;