const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');

mongoose.Promise = global.Promise

if (!mongoose.connection.db) {
    mongoose.connect('mongodb://localhost/musichelper')
}

const db = mongoose.connection

const Schema = mongoose.Schema

const user = new Schema({
    // username = display_name || could be NULL!
    username : {
        type: String,
        required: true,
        unique: true
    },
    passwordHash: String,
    passwordSalt: String,
    artists: [String],
    spotifyId: String,
    premium: Boolean,
    uri: String,
    country: String, // requires scope = user-read-private
    href: String, // web api endpoint for this user
    imageURL: String

})

user.methods.setPassword = function (password) {
    this.passwordSalt = crypto.randomBytes(16).toString('hex')
    this.passwordHash = crypto.pbkdf2Sync(password, this.passwordSalt, 1000, 64).toString('hex')
}

user.methods.checkPassword = function (password) {
    let testHash = crypto.pbkdf2Sync(password, this.passwordSalt, 1000, 64).toString('hex')
    return testHash === this.passwordHash
}


const User = mongoose.model('musicHelper',user)



module.exports = User