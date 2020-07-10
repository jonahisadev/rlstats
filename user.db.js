const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/rls', {useNewUrlParser: true, useUnifiedTopology: true});

var userSchema = mongoose.Schema({
    discord_id: String,
    url: String,
    // stats: Object,

    in_session: Boolean,
    session_stats: Object
});

module.exports = mongoose.model('User', userSchema);