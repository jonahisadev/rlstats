const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/rls', {useNewUrlParser: true, useUnifiedTopology: true});

var userSchema = mongoose.Schema({
    // Basics
    discord_id: String,
    url: String,
    // stats: Object,
    in_session: Boolean,

    // For Tracker Network
    session_stats: Object,

    // For BallChasing
    bc_key: String,
    bc_session_start: Date 

});

module.exports = mongoose.model('User', userSchema);