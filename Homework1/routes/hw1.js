const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});


router.get('/:name', function(req, res, next) {

    let theName = req.params.name
    let response = {
        name: theName,
        length: theName.length
    }
    res.json(response)

});

router.post('/', function (req,res,next) {
    let theName = req.body.name;
    let response = {
        name: theName,
        length: theName.length
    }
    res.json(response)
});




module.exports = router;
