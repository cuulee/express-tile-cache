var debug = require('debug')('tilecache:fsstorage');
var fs = require('fs.extra');
var path = require('path');

module.exports = fsFileStorage;

function fsFileStorage(rootdir) {
  if(!(this instanceof fsFileStorage)) {
    return new fsFileStorage(rootdir);
  }

  //defaulting to "cache" dir
  this.tilepath = rootdir || "cache";

  if(!fs.existsSync(this.tilepath)) {
    fs.mkdirRecursiveSync(this.tilepath);
  }
}

fsFileStorage.prototype.get =
fsFileStorage.prototype.getFileStream = function(filepath) {
  return fs.createReadStream(filepath);
}


/**
 * Stores a file in FS and calls callback with file details
 * @param {Stream} inputStream. Stream to save from.
 * @param {String} filename. File path/name.
 * @param {Function} callback. Function to call with upload details
 *   - {Error} err. Null if nothing bad happened
 *   - {Function} details. Saved details compatible with S3.
 *       {
 *         Location: 'https://bucketName.s3.amazonaws.com/filename.ext',
 *         Bucket: 'bucketName',
 *         Key: 'filename.ext',
 *         ETag: '"bf2acbedf84207d696c8da7dbb205b9f-5"'
 *       }
 */
fsFileStorage.prototype.save =
fsFileStorage.prototype.saveStreamToFile = function(inputStream, filename, callback) {

  var _this = this;
  var location = path.join(this.tilepath,filename);
  var fileStream = fs.createWriteStream(location);

  fileStream.once('finish', function() {
    var details = {
      Location: location,
      Key: path.basename(filename),
      ETag: path.basename(filename),
      Bucket: _this.tilepath
    }
    debug("File %s stored succesfully on %s", details.Key, details.Bucket);
    callback(null, details);
  });
  //this.uploadStream.maxPartSize(2048);

  //couldn't make the stream fail, so ignore for coverage
  fileStream.on('error', /* istanbul ignore next */ function(error) {
    debug("Error:");
    debug(error);
    callback(error);
  });


  debug("Started piping to %s", filename);
  inputStream.pipe(fileStream);

}
