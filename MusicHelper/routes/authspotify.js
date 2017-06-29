// Router instance
const express = require('express');
const router = express.Router();

// Get configs
const spotifyConfig = require('../config/spotify')
const ticketMasterConfig = require('../config/ticketmaster')

// Connect to User database
const User = require('../models/User')

// import passport
const passport = require('passport')
const SpotifyStrategy = require('../node_modules/passport-spotify/lib/passport-spotify/index').Strategy

// import request
//const request = require('request')
const request = require('request-promise')

// import bluebird promises
const Promise = require('bluebird')

const passportOptions = {
    clientID: spotifyConfig.client_id,
    clientSecret: spotifyConfig.client_secret,
    callbackURL: spotifyConfig.redirect_uri
}


passport.use(new SpotifyStrategy(passportOptions,
    function (accessToken, refreshToken,profile,done) {

        spotifyConfig.access_token = accessToken

        let photos = profile.photos
        User.findOneAndUpdate({spotifyId:profile.id},
            {
                username: profile.displayName,
                spotifyId: profile.id,
                // TODO artists: need to get artists
                premium: profile.product === "premium",
                uri: profile._json.uri,
                country: profile.country,
                href: profile._json.href,
                imageURL: photos[0]
            },
            {'upsert': 'true'},
            function (err, result) {
                if (err) {
                    console.log(err)
                    return done(err,null)
                } else {
                    return done(null,profile)
                }
            }
        )

    }
))


passport.serializeUser(function (user,done) {
    done(null,user.id)
})

passport.deserializeUser(function (id,done) {
    console.log('Inside deserialize with id', id)
    User.findOne({spotifyId:id}, function (err, user) {
        done(err, user)
    })
})

router.get('/success', function (req,res,next) {
    res.redirect('/')
})

router.get('/logout', function (req,res,next) {
    console.log("Inside logout() req:", req.body)

    User.findOneAndRemove({spotifyID: req.body.spotifyID})
        .then(function (err,response) {
            req.logOut()
            res.clearCookie()
            res.status = 401
            res.redirect('/')
        })

})

// OAuth Step 1
router.get('/spotify',
    passport.authenticate('spotify',{scope: ['user-read-email', 'user-read-private', 'user-library-read'],showDialog: true })
)

// OAuth Step 2
router.get('/callback',
    passport.authenticate('spotify',
        {failureRedirect: '/'}),
    function (req,res) {
        res.cookie('authStatus','true')
        res.cookie('user.SpotifyID',req.user.id)
        res.cookie('user.Name',req.user.displayName)
        //res.cookie('name',)
        res.cookie('user.imageURL',req.user.photos[0])
        res.redirect('/')
    }
)


const sendSpotifyRequest = function (offset) {
    return new Promise(function (resolve,reject) {
        let access_token = spotifyConfig.access_token
        const options = {
            method: 'GET',
            url: 'https://api.spotify.com/v1/me/tracks',
            headers: {
                'Authorization': 'Bearer ' + access_token
            },
            qs: {
                limit:50,
                offset:offset
            }
        }
        const returnObj = {}

        request.get(options)
            .then(function (body) {
                let artists = []
                //console.log(body)
                let jsonBody = JSON.parse(body)
                if (jsonBody.error) {
                    reject(jsonBody)
                } else {

                    for (let itemsIndex = 0; itemsIndex < jsonBody.items.length; itemsIndex++) {
                        let track = jsonBody.items[itemsIndex].track
                        for (let artistIndex = 0; artistIndex < track.artists.length; artistIndex++) {
                            let artistName = track.artists[artistIndex]
                            if (artists.indexOf(artistName.name) < 0) {
                                artists.push(artistName.name)
                            }
                        }
                    }
                    resolve(artists)
                    //resolve(jsonBody)
                }
            })
    })
}

const filterArtists = function (jsonBody) {
    return
}

// Send the request to the Spotify web api
// returns as a Javascript object:
// {
// status: The status of the response from Spotify (-1 = error, 0 = no error but still not done, 1 = no error and done)
// artists: An Array holding the list of unique artists in all returned albums
// newOffset: The new offset to use in the next call
// }
// THIS DOESN'T WORK, NEED TO IMPLEMENT THIS WITH PROMISES TO POPULATE ARTISTS SYNCHRONOUSLY...
// const sendSpotifyRequest = function (offset) {
//
//     let access_token = spotifyConfig.access_token
//
//     const options = {
//         method: 'GET',
//         url: 'https://api.spotify.com/v1/me/albums',
//         headers: {
//             'Authorization': 'Bearer ' + access_token
//         },
//         qs: {
//             limit:50,
//             offset:offset
//         }
//
//     }
//
//     const returnObj = {}
//
//     request.get(options)
//         .then(function(response,body) {
//             let jsonBody = JSON.parse(body)
//             // If returned error then return -1
//             if(jsonBody.error){
//                 returnObj.status = -1
//                 return returnObj
//             } else {
//                 console.log(jsonBody.items.length)
//                 if (jsonBody.items.length == 0) {
//                     returnObj.status = 1
//                     returnObj.artists = NaN
//                     returnObj.newOffset = NaN
//                     return returnObj
//                 }
//
//                 let artists = []
//                 let newOffset = offset + jsonBody.items.length
//                 // Iterate through all albums
//                 for (let albumIndex = 0; albumIndex < jsonBody.items.length; albumIndex++) {
//                     let album = jsonBody.items[albumIndex].album
//                     // Iterate through all artists in each album (could be > 1)
//                     for (let artistsIndex = 0; artistsIndex < album.artists.length; artistsIndex++) {
//                         artistName = album.artists[artistsIndex].name
//                         // Add to list if not a member
//                         if (artists.indexOf(artistName) == -1) {
//                             artists.push(album.artists[artistsIndex].name)
//                         }
//                     }
//                 }
//
//                 returnObj.status = 0
//                 returnObj.artists = artists
//                 returnObj.newOffset = newOffset
//                 return returnObj
//             }
//
//         })
//         .catch(function (err) {
//             returnObj.status = -1
//             returnObj.artists = NaN
//             returnObj.newOffset = NaN
//             return returnObj
//         })
// }

// Function to send the ticketmaster request
const sendTicketMasterRequest = function (artist) {

    return new Promise(function(resolve,reject) {

        let apikey = ticketMasterConfig.ConsumerKey

        let options = {
            method: "GET",
            url:"https://app.ticketmaster.com/discovery/v2/events",
            qs: {
                apikey: apikey,
                keyword: artist
            },
            async: true,
            dataType: "json"
        }

        request.get(options)
            .then(function (response) {
                //console.log(response)
                responseJSON = JSON.parse(response)
                if (!responseJSON._embedded) {
                    //console.log("No Events Found!", artist)
                    resolve([])
                } else {
                    //console.log("Artist:",artist,"\nResponse in sendTicketMaster",responseJSON)
                    resolve(responseJSON._embedded.events)
                }
            }, function (error) {
                console.log("ERROR: ", error)
            })
    })

    
    // $.ajax({
    //     type: "GET",
    //     url:"https://app.ticketmaster.com/discovery/v2/events.json?apikey="+apikey+"keyword=Sheeran",
    //     async: true,
    //     dataType: "json",
    //     success: function (json) {
    //         console.log(json)
    //     },
    //     error: function (xhr,status,err) {
    //         console.log("ERROR")
    //     }
    // })
    

}

// Method to loop promises with a condition (stolen shamelessly from SO)
const promiseWhile = Promise.method(function(condition, action) {
    if (!condition()) return;
    return action().then(promiseWhile.bind(null, condition, action));
});

const promiseFor = Promise.method(function(condition, action, value,total) {
    console.log("value: ", value, "total: ", total)
    if (!condition(value,total)) {
        console.log("Returning value = ", value)
        return value;
    }
    return action(value)
        .then(promiseFor.bind(null, condition, action, value, total));
});

// This is such a pain in the ass
function fetchEvents(arr) {
    let events = []
    return arr.reduce(function(promise, artist) {
        return promise.then(function() {
            return sendTicketMasterRequest(artist)
                .then(function (response) {
                    if (!response) {
                        console.log("[]")
                    } else {
                        events.push({
                            artist: artist,
                            events: response
                        })
                    }
                    return events
                })
        });
    }, Promise.resolve());
}

// Helper function to merge two lists without duplicates
const filterDuplicatesAndMerge = function(arrayA,arrayB) {
    return arrayA.concat(arrayB.filter(function (item) {
        return arrayA.indexOf(item) < 0
    }))
}


const cleanDates = function (responseObj) {
    for (let i = 0; i < responseObj.length; i++) {
        let events = responseObj[i].events
        for (let event= 0; event < events.length; event++) {
            let datetime = Date.parse(events[event].dates.start.dateTime)
            events[event].dates.start.dateTime = datetime
        }
    }
    return responseObj
}

// TODO: Link this route with the sendSpotifyRequest function to get all user artists
// figure out what happens when you hit the end of the library, does it return nothing?
router.get('/findEvents',function (req,res,next) {

    let offset = 0
    let artists = []


    sendSpotifyRequest(offset)
        .then(function (response) {
            //console.log(response)
            console.log("Initial call response length:",response.length)


            //res.send(response)


            
            let artists = response

            console.log("Artists :",artists)
            let total = artists.length
            let events = []
            let count = 0
            
            fetchEvents(artists)
                .then(function (response) {
                    console.log("all done...")
                    let newResponse = cleanDates(response)
                    console.log(newResponse)
                    res.send(newResponse)
                })
            

            // promiseFor(
            //     function (count,total) {  // condition
            //     console.log("Count: ", count, "Total:", total)
            //     return count < total
            // },
            // function (count) { // action
            //     return sendTicketMasterRequest(artists[count])
            //         .then(function (response) {
            //             console.log("Response:",response)
            //             events.push(response)
            //             count += 1
            //             return count + 1
            //         })
            // },
            //     count,     // value
            //     total  // total
            // ).then(console.log.bind("all done??"))

            // sendTicketMasterRequest(artists)
            //     .then(function (response) {
            //         res.send(response)
            //     })
            
            // promiseFor(function (count) {
            //     console.log("count: ", count, "total: ", total)
            //     return count < 800
            // }, function (count) {
            //     return sendSpotifyRequest(count)
            //         .then(function (response) {
            //             console.log("Inside .then of sendSpot")
            //             return count + 50
            //         })
            // }, 0).then(console.log.bind(console, 'all done'))


            // promiseWhile(function () {
            //     console.log("Offset: ", offset , " Total: ", total)
            //     return offset < total
            // },function () {
            //     return new Promise(function(resolve, reject) {
            //         sendSpotifyRequest(offset)
            //             .then(function (response) {
            //                 offset += 50
            //                 artists = filterDuplicatesAndMerge(artists,response)
            //                 console.log("Artists length: ", artists.length)
            //                 resolve(artists)
            //             },function (error) {
            //                 console.log(error)
            //             })
            //     })
            // })
            //     .then(function() {
            //     console.log("Finished: ", artists)
            // })

        },function (error) {
            res.send(error)
        })



})


module.exports = router;
