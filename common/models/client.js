var gcm = require('node-gcm');
var sender = new gcm.Sender('AIzaSyDHWaBo8vRPz15jvvRdukwZSDYZQIVUGJY');
var message = new gcm.Message();
message.addData('key1', 'msg1');

module.exports = function(Client) {

	Client.track = function(data, callback) {
		var uid_sender = data.uid_sender;
		var uid_to_track = data.uid_to_track;

		if(typeof(uid_sender) == 'undefined' || typeof(uid_to_track) == 'undefined') {
			var err = new Error('uid_sender and uid_to_track should be set in post body');
	        err.statusCode = 404;
	        callback(err);
	        return;
		}

		Client.findById(uid_to_track, function(err, client) {
			console.log(client);
			if(err) {
				callback(err);
			} else if (client) {
				if (client.blocked.indexOf(uid_sender) >= 0) {
					var err = new Error('That person has blocked you');
					err.statusCode = 404;
					callback(err);
				} else if (client.wantToTrack.indexOf(uid_sender) >= 0) {
					callback(null);
				} else if (client.trackers.indexOf(uid_sender) >= 0) {
					var err = new Error('You are already tracking that person');
					err.statusCode = 404;
					callback(err);
				} else {
					client.wantToTrack.push(uid_sender);
					client.save(function (err) {
          				if(err) callback(err);
         				else callback(null);
        			});
				}
			} else {
				var err = new Error('User To be tracked Not Found');
	        	err.statusCode = 404;
	        	callback(err);
			}
		});
	};

	Client.block = function(data, callback) {
		var uid_sender = data.uid_sender;
		var uid_to_block = data.uid_to_block;

		if(typeof(uid_sender) == 'undefined' || typeof(uid_to_block) == 'undefined') {
			var err = new Error('uid_sender and uid_to_block should be set in post body');
	        err.statusCode = 404;
	        callback(err);
	        return;
		}

		Client.findMultipleByIds([uid_sender, uid_to_block], [], function(err, client_list) {
			if(err) {
				callback(err);
			} 

			client_sender = client_list[0];
			client_to_block = client_list[1];
			
			if (client_sender.blocked.indexOf(uid_to_block) < 0) {
				client_sender.blocked.push(uid_to_block);
			}
			if (client_sender.wantToTrack.indexOf(uid_to_block) >= 0) {
				client_sender.wantToTrack.splice(client_sender.wantToTrack.indexOf(uid_to_block), 1);
			}
			if (client_sender.trackers.indexOf(uid_to_block) >= 0) {
				client_sender.trackers.splice(client_sender.trackers.indexOf(uid_to_block), 1);
			}
			if (client_to_block.tracking.indexOf(uid_sender) >= 0) {
				client_to_block.tracking.splice(client_to_block.tracking.indexOf(uid_sender), 1);
			}

			client_sender.save(function (err) {
      			if(err) callback(err);
     			else {
     				client_to_block.save(function(err){
     					if(err) callback(err);
     					else callback(null);
     				});
    			}
    		});
		});
	};

	Client.findMultipleByIds = function(uid_list, client_list, callback) {
		console.log(uid_list);
		if(uid_list.length == 0) {
			callback(null ,client_list);
			return;
		}
		var current_uid = uid_list[0];
		uid_list.splice(0, 1);
		console.log(current_uid);
		Client.findById(current_uid, function(err, client){
			if(err) {
				callback(err);
			} else if (client) {
				client_list.push(client);
				Client.findMultipleByIds(uid_list, client_list, callback);
			} else {
				var err = new Error('User not found');
	        	err.statusCode = 404;
	        	callback(err);
			}
		});
	}

	Client.allowTrack = function(data, callback) {
		var uid_allower = data.uid_allower;
		var uid_allowed = data.uid_allowed;

		if(typeof(uid_allower) == 'undefined' || typeof(uid_allowed) == 'undefined') {
			var err = new Error('uid_allowed and uid_allower should be set in post body');
	        err.statusCode = 404;
	        callback(err);
	        return;
		}

		Client.findMultipleByIds([uid_allower, uid_allowed], [], function(err, client_list){
			if (err) {
	        	callback(err);
	        	return;
			}
			var client_allower = client_list[0];
			var client_allowed = client_list[1];
			if (client_allower.blocked.indexOf(uid_allowed) >= 0) {
				var err = new Error('User is blocked, unblock first to allow access');
				err.statusCode = 404;
				callback(err);
			}
			if (client_allower.wantToTrack.indexOf(uid_allowed) >= 0) {
				client_allower.wantToTrack.splice(client_allower.wantToTrack.indexOf(uid_allowed), 1);
			} else {
				if (client_allower.trackers.indexOf(uid_allowed) >= 0) {
					var err = new Error('Allowed already in tracking list');
		       		err.statusCode = 404;
		        	callback(err);
				} else {
					var err = new Error('Allowed did not send track request');
		       		err.statusCode = 404;
		        	callback(err);
		        }
		        return;
			} 
			if (client_allower.trackers.indexOf(uid_allowed) < 0) {
				client_allower.trackers.push(uid_allowed);
			}
			if (client_allowed.tracking.indexOf(uid_allower) < 0) {
				client_allowed.tracking.push(uid_allower);
			}

			client_allower.save(function(err){
				if (err) callback(err);
				else {
					client_allowed.save(function(err){
						if(err) callback(err);
						else callback(null);
					});
				}
			});
		}); 
	};

	Client.unBlock = function(data, callback) {
		var uid_sender = data.uid_sender;
		var uid_to_unblock = data.uid_to_unblock;

		if(typeof(uid_sender) == 'undefined' || typeof(uid_to_unblock) == 'undefined') {
			var err = new Error('uid_sender and uid_to_unblock should be set in post body');
	        err.statusCode = 404;
	        callback(err);
	        return;
		}

		Client.findById(uid_sender, function(err, client) {
			if (err) {
				callback(err);
			} else if (client) {
				if (client.blocked.indexOf(uid_to_unblock) >= 0) {
					console.log("yes");
					client.blocked.splice(client.blocked.indexOf(uid_to_unblock), 1);
				}
				client.save(function (err) {
          			if(err) callback(err);
         			else callback(null);
        		});
			} else {
				var err = new Error('User_sender not found');
	        	err.statusCode = 404;
	        	callback(err);
			}
		});
	};

	Client.setSnooze = function(data, callback) {
		var uid = data.email;
		
		if(typeof(uid) == 'undefined') {
			var err = new Error('email should be set in post body');
	        err.statusCode = 404;
	        callback(err);
	        return;
		}
		Client.findById(uid, function(err, client) {
			if (err) {
				callback(err);
			} else if (client) {
				client.isSnoozed = true;
				client.save(function(err) {
					if(err) callback(err);
					else callback(null);
				});
			} else {
				var err = new Error('User not found');
	        	err.statusCode = 404;
	        	callback(err);
			}
		});		
	}

	Client.sendMessage = function(message, gcmRegId) {
		sender.send(message, [gcmRegId], function (err, result) {
    		if (err) console.error(err);
    		else    console.log(result);
		});
	};

	Client.sendAllGcmMessages = function(list_of_trackers, index) {
		if(list_of_trackers.length > index) {
			Client.findById(list_of_trackers[index], function(err, client){
				if(!err) {
					Client.sendMessage(client.gcmRegId);
				}
				Client.sendAllGcmMessages(list_of_trackers, index + 1);
			});
		}
	};

	Client.updatePosition = function(data, callback) {
		var uid = data.email;
		var position = data.position;

		if(typeof(uid) == 'undefined' || typeof(position) == 'undefined') {
			var err = new Error('Id and position should be set in post body');
	        err.statusCode = 404;
	        callback(err);
	        return;
		}

		Client.findById(uid, function(err, client) {
			if(err) {
				callback(err);
			} else if (client) {
				client.position = position;
				Client.sendAllGcmMessages(client.trackers, 0);
			} else {
				var err = new Error('User Not Found');
	        	err.statusCode = 404;
	        	callback(err);
			}
		});
	};

	Client.registerGCM = function(data, callback) {
		var uid = data.email;
		var gcmRegId = data.gcmRegId;

		if(typeof(uid) == 'undefined' || typeof(gcmRegId) == 'undefined') {
			var err = new Error('Id and gcmRegId should be set in post body');
	        err.statusCode = 404;
	        callback(err);
	        return;
		}

    	Client.findById(uid,function(err,client){
	    	if(err) {
	    		callback(err);
	    	} else if (client) {
	        	client.gcmRegId = gcmRegId;
	        	client.save(function (err) {
	          		if(err) callback(err);
	          		else callback(null);
	        	});
	      	} else {
	        	var err = new Error('User Not Found');
	        	err.statusCode = 404;
	        	callback(err);
	        }
      	});
    };

  Client.remoteMethod(
    'unBlock',
    {
      description: 'Unblock a blocked user. uid_sender and uid_to_unblock must be set in post body',
      accepts: [
        { arg: 'data', type: 'object', required: true, http: { source:'body'} }
      ],
      returns: {
        http: {verb: 'post'}
      }
    }
  );

  Client.remoteMethod(
    'registerGCM',
    {
      description: 'Register the gcmRegToken for the user. email and gcmRegId should be set in post body',
      accepts: [
        { arg: 'data', type: 'object', required: true, http: { source:'body'} }
      ],
      returns: {
        http: {verb: 'post'}
      }
    }
  );

  Client.remoteMethod(
    'setSnooze',
    {
      description: 'Snooze the client to not to recieve any further notifications, email should be set in post body',
      accepts: [
        { arg: 'data', type: 'object', required: true, http: { source:'body'} }
      ],
      returns: {
        http: {verb: 'post'}
      }
    }
  );

  Client.remoteMethod(
    'allowTrack',
    {
      description: 'Allow a person to track you. uid_allower and uid_allowed should be set in the post body',
      accepts: [
        { arg: 'data', type: 'object', required: true, http: { source:'body'} }
      ],
      returns: {
        http: {verb: 'post'}
      }
    }
  );

  Client.remoteMethod(
    'updatePosition',
    {
      description: 'Update the current position of the person, email and position should be set in post body',
      accepts: [
        { arg: 'data', type: 'object', required: true, http: { source:'body'} },
      ],
      returns: {
        http: {verb: 'post'}
      }
    }
  );

  Client.remoteMethod(
    'block',
    {
      description: 'Tell server that someone wants to block someone. uid_sender and uid_to_block must be set in post body',
      accepts: [
        { arg: 'data', type: 'object', required: true, http: { source:'body'} },
      ],
      returns: {
        http: {verb: 'post'}
      }
    }
  );

  Client.remoteMethod(
    'track',
    {
      description: 'Tell server that someone wants to track someone. uid_sender and uid_to_track must be set in post body',
      accepts: [
        { arg: 'data', type: 'object', required: true, http: { source:'body'} },
      ],
      returns: {
        http: {verb: 'post'}
      }
    }
  );

  Client.remoteMethod(
    'sendMessage',
    {
      description: 'Test if GCM is working',
      accepts: [
        { arg: 'gcm_id', type: 'string', required: true, http: { source:'body'} }
      ],
      returns: {
        http: {verb: 'post'}
      }
    }
  );
};
