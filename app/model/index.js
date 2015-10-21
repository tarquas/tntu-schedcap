'use strict';

/* global mongoose */

mongoose.ERROR_DUPLICATE = 11000;

let opts = {mongoose: mongoose};

require('mongoose-hook')({}, opts);

mongoose.plugin(require('mongoose-hook-custom-id'), opts);
mongoose.plugin(require('mongoose-hook-ensure-indexes'), opts);
mongoose.plugin(require('mongoose-hook-revision'), opts);
mongoose.plugin(require('mongoose-hook-createdmodified'), opts);
