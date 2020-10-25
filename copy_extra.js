// B&L PLYOS

// 57d000fbdf50a74bb704573a
// 57d00905df50a74bb7045740


// UP BODY
// 57d00828df50a74bb704573e
// 57d009cadf50a74bb7045742

var path = require('path');
var Model = require('./models');

// Call this to init the DB ... so that all future models load instantly...



function copyExtraImages (w){

	var base_folder = path.join(path.dirname(require.main.filename), "uploads", "extras");
	var target_folder = path.join(path.dirname(require.main.filename), "uploads", "extras_migration");	

	if(w.image){
		var path_info = path.parse(w.image);
		Model.copyFile(path.join(base_folder, w.image), path.join(target_folder, w.image), function(e){return;});
		Model.copyFile(path.join(base_folder, path_info.name+"_thumb"+path_info.ext), path.join(target_folder, path_info.name+"_thumb"+path_info.ext), function(e){return;});
		Model.copyFile(path.join(base_folder, path_info.name+"_w150"+path_info.ext), path.join(target_folder, path_info.name+"_w150"+path_info.ext), function(e){return;});
		Model.copyFile(path.join(base_folder, path_info.name+"_h150"+path_info.ext), path.join(target_folder, path_info.name+"_h150"+path_info.ext), function(e){return;});
		Model.copyFile(path.join(base_folder, path_info.name+"_med"+path_info.ext), path.join(target_folder, path_info.name+"_med"+path_info.ext), function(e){return;});
	}

	if(w.video && w.video.indexOf('http') != 0){
		Model.copyFile(path.join(base_folder, w.video), path.join(target_folder, w.video), function(e){if(e){console.error("Failed to Save: "+w.video+", "+e);}});
	}
	if(w.videos && w.videos.length){
		w.videos.forEach(function(v){
			if(!v || v.indexOf('http') == 0) return;
			Model.copyFile(path.join(base_folder, v), path.join(target_folder, v), function(e){if(e){console.error("Failed to Save: "+v+", "+e);}});	
		});
	}
	// copy Video Thumbnail
	if(w.video_thumbnail){
		var path_info = path.parse(w.video_thumbnail);
		Model.copyFile(path.join(base_folder, w.video_thumbnail), path.join(target_folder, w.video_thumbnail), function(e){if(e){console.error("Failed to Save Org: "+w.video_thumbnail+", "+e);}});
		Model.copyFile(path.join(base_folder, path_info.name+"_thumb"+path_info.ext), path.join(target_folder, path_info.name+"_thumb"+path_info.ext), function(e){if(e){console.error("Failed to Save Thumb: "+w.video_thumbnail+", "+e);}});
		Model.copyFile(path.join(base_folder, path_info.name+"_w150"+path_info.ext), path.join(target_folder, path_info.name+"_w150"+path_info.ext), function(e){if(e){console.error("Failed to Save w150: "+w.video_thumbnail+", "+e);}});
		Model.copyFile(path.join(base_folder, path_info.name+"_h150"+path_info.ext), path.join(target_folder, path_info.name+"_h150"+path_info.ext), function(e){if(e){console.error("Failed to Save h150: "+w.video_thumbnail+", "+e);}});
		Model.copyFile(path.join(base_folder, path_info.name+"_med"+path_info.ext), path.join(target_folder, path_info.name+"_med"+path_info.ext), function(e){if(e){console.error("Failed to Save Med: "+w.video_thumbnail+", "+e);}});
	}

	// copy Image Thumbnail
	if(w.image_thumbnail){
		var path_info = path.parse(w.image_thumbnail);
		Model.copyFile(path.join(base_folder, w.image_thumbnail), path.join(target_folder, w.image_thumbnail), function(e){if(e){console.error("Failed to Save Org: "+w.image_thumbnail+", "+e);}});
		Model.copyFile(path.join(base_folder, path_info.name+"_thumb"+path_info.ext), path.join(target_folder, path_info.name+"_thumb"+path_info.ext), function(e){if(e){console.error("Failed to Save Thumb: "+w.image_thumbnail+", "+e);}});
		Model.copyFile(path.join(base_folder, path_info.name+"_w150"+path_info.ext), path.join(target_folder, path_info.name+"_w150"+path_info.ext), function(e){if(e){console.error("Failed to Save w150: "+w.image_thumbnail+", "+e);}});
		Model.copyFile(path.join(base_folder, path_info.name+"_h150"+path_info.ext), path.join(target_folder, path_info.name+"_h150"+path_info.ext), function(e){if(e){console.error("Failed to Save h150: "+w.image_thumbnail+", "+e);}});
		Model.copyFile(path.join(base_folder, path_info.name+"_med"+path_info.ext), path.join(target_folder, path_info.name+"_med"+path_info.ext), function(e){if(e){console.error("Failed to Save Med: "+w.image_thumbnail+", "+e);}});
	}

	// copy Music Thumbnail
	if(w.thumbnail){
		var path_info = path.parse(w.thumbnail);
		Model.copyFile(path.join(base_folder, w.thumbnail), path.join(target_folder, w.thumbnail), function(e){if(e){console.error("Failed to Save Org: "+w.thumbnail+", "+e);}});
		Model.copyFile(path.join(base_folder, path_info.name+"_thumb"+path_info.ext), path.join(target_folder, path_info.name+"_thumb"+path_info.ext), function(e){if(e){console.error("Failed to Save Thumb: "+w.thumbnail+", "+e);}});
		Model.copyFile(path.join(base_folder, path_info.name+"_w150"+path_info.ext), path.join(target_folder, path_info.name+"_w150"+path_info.ext), function(e){if(e){console.error("Failed to Save w150: "+w.thumbnail+", "+e);}});
		Model.copyFile(path.join(base_folder, path_info.name+"_h150"+path_info.ext), path.join(target_folder, path_info.name+"_h150"+path_info.ext), function(e){if(e){console.error("Failed to Save h150: "+w.thumbnail+", "+e);}});
		Model.copyFile(path.join(base_folder, path_info.name+"_med"+path_info.ext), path.join(target_folder, path_info.name+"_med"+path_info.ext), function(e){if(e){console.error("Failed to Save Med: "+w.thumbnail+", "+e);}});
	}

	// Copy PDF
	if(w.pdf){
		Model.copyFile(path.join(base_folder, w.pdf), path.join(target_folder, w.pdf), function(e){if(e){console.error("Failed to Save: "+w.pdf+", "+e);}});
	}
}

Model.init();

// Video Extra

Model.load('videoextra', {}, function(err, videoextra){

	if(err){
		console.error("Error1: "+err);
	}
	
	if(videoextra){
		// FnT
		// videoextra.find({"trainer_id": "57c5310521bbac1d01aa75db"}).forEach(function(ve){
		// TWL
		// videoextra.find({"trainer_id": "584fbe1dadbdd05d535cddae"}).forEach(function(ve){
		// MN
		// videoextra.find({"trainer_id": "58f66e596e288005867db979"}).forEach(function(ve){
		// MTC
		// videoextra.find({"trainer_id": "5822bfb2b86828570dd90899"}).forEach(function(ve){
		// Z Body
		// videoextra.find({"trainer_id": "5a848f72c3b5c3530a8d05f1"}).forEach(function(ve){
		// Holly Barker
		// videoextra.find({"trainer_id": "5a3c25bf34d092539e01b020"}).forEach(function(ve){
		// Tianna
		// videoextra.find({"trainer_id": "5a690da90379ce6d1fed04ac"}).forEach(function(ve){
		// Fit By Valen
		// videoextra.find({"trainer_id": "5a9d7d110a4ae17da220a43e"}).forEach(function(ve){
		// Booth Camp
		videoextra.find({"trainer_id": "5a8c7aff14d55f7ad445a6f3"}).forEach(function(ve){
		// DFG
		// videoextra.find({"trainer_id": "586f341b1cfef774222b1821"}).forEach(function(ve){
			if(err){
				console.error("VE Error: "+err);
			}
			copyExtraImages(ve);
		 	delete ve._id;
			videoextra.db.collection("videoextra_migration").insert(ve, function(err, res){
				if(err){
					console.error("VE Error: "+err);
				}
			});
			
		});
	}

});

// Image Extra

Model.load('imageextra', {}, function(err, imageextra){

	if(err){
		console.error("Error1: "+err);
	}
	


	if(imageextra){
		// FnT
		// imageextra.find({"trainer_id": "57c5310521bbac1d01aa75db"}).forEach(function(ie){
		// TWL
		// imageextra.find({"trainer_id": "584fbe1dadbdd05d535cddae"}).forEach(function(ie){
		// MTC
		// imageextra.find({"trainer_id": "5822bfb2b86828570dd90899"}).forEach(function(ie){
		// Z Body
		// imageextra.find({"trainer_id": "5a848f72c3b5c3530a8d05f1"}).forEach(function(ie){
		// Holly Barker
		// imageextra.find({"trainer_id": "5a3c25bf34d092539e01b020"}).forEach(function(ie){
		// Tianna
		imageextra.find({"trainer_id": "5a690da90379ce6d1fed04ac"}).forEach(function(ie){
		// MN
		// imageextra.find({"trainer_id": "58f66e596e288005867db979"}).forEach(function(ie){
		// DFG
		// imageextra.find({"trainer_id": "586f341b1cfef774222b1821"}).forEach(function(ie){
			if(err){
				console.error("ie Error: "+err);
			}
			//copyExtraImages(ie);
			delete ie._id;
			imageextra.db.collection("imageextra_migration").insert(ie, function(err, res){
				if(err){
					console.error("ie Error: "+err);
				}
			});
			
		});
	}

});

// Music Extra

Model.load('musicextra', {}, function(err, musicextra){

	if(err){
		console.error("Error1: "+err);
	}
	


	if(musicextra){
		// FnT
		// musicextra.find({"trainer_id": "57c5310521bbac1d01aa75db"}).forEach(function(me){
		// TWL
		// musicextra.find({"trainer_id": "584fbe1dadbdd05d535cddae"}).forEach(function(me){
		// MN
		// musicextra.find({"trainer_id": "58f66e596e288005867db979"}).forEach(function(me){
		// MTC
		// musicextra.find({"trainer_id": "5822bfb2b86828570dd90899"}).forEach(function(me){
		// Z Body
		//musicextra.find({"trainer_id": "5a848f72c3b5c3530a8d05f1"}).forEach(function(me){
		// Holly Barker
		// musicextra.find({"trainer_id": "5a3c25bf34d092539e01b020"}).forEach(function(me){
		// Tianna
		//musicextra.find({"trainer_id": "5a690da90379ce6d1fed04ac"}).forEach(function(me){
		// Booth Camp
		musicextra.find({"trainer_id": "5a8c7aff14d55f7ad445a6f3"}).forEach(function(me){
		// DFG
		// musicextra.find({"trainer_id": "586f341b1cfef774222b1821"}).forEach(function(me){
			if(err){
				console.error("me Error: "+err);
			}
			copyExtraImages(me);
			delete me._id;
			musicextra.db.collection("musicextra_migration").insert(me, function(err, me){
				if(err){
					console.error("me Error: "+err);
				}
			});
			
		});
	}

});

// Event Extra

Model.load('eventextra', {}, function(err, eventextra){

	if(err){
		console.error("Error1: "+err);
	}
	


	if(eventextra){
		// FnT
		// eventextra.find({"trainer_id": "57c5310521bbac1d01aa75db"}).forEach(function(ee){
		// TWL
		// eventextra.find({"trainer_id": "584fbe1dadbdd05d535cddae"}).forEach(function(ee){
		// MN
		// eventextra.find({"trainer_id": "58f66e596e288005867db979"}).forEach(function(ee){
		// MTC
		// eventextra.find({"trainer_id": "5822bfb2b86828570dd90899"}).forEach(function(ee){
		// Z Body
		// eventextra.find({"trainer_id": "5a848f72c3b5c3530a8d05f1"}).forEach(function(ee){
		// Holly Barker
		//eventextra.find({"trainer_id": "5a3c25bf34d092539e01b020"}).forEach(function(ee){
		// Tianna
		eventextra.find({"trainer_id": "5a690da90379ce6d1fed04ac"}).forEach(function(ee){
		// DFG
		// eventextra.find({"trainer_id": "586f341b1cfef774222b1821"}).forEach(function(ee){
			if(err){
				console.error("ee Error: "+err);
			}
			//copyExtraImages(ee);
			delete ee._id;
			eventextra.db.collection("eventextra_migration").insert(ee, function(err, ee){
				if(err){
					console.error("ee Error: "+err);
				}
			});
			
		});
	}

});

// Other Extra
Model.load('otherextra', {}, function(err, otherextra){

	if(err){
		console.error("Error1: "+err);
	}
	


	if(otherextra){
		// FnT
		// otherextra.find({"trainer_id": "57c5310521bbac1d01aa75db"}).forEach(function(oe){
		// TWL
		// otherextra.find({"trainer_id": "584fbe1dadbdd05d535cddae"}).forEach(function(oe){
		// MN
		// otherextra.find({"trainer_id": "58f66e596e288005867db979"}).forEach(function(oe){
		// MTC
		// otherextra.find({"trainer_id": "5822bfb2b86828570dd90899"}).forEach(function(oe){
		// Z Body
		// otherextra.find({"trainer_id": "5a848f72c3b5c3530a8d05f1"}).forEach(function(oe){
		// Holly Barker
		// otherextra.find({"trainer_id": "5a3c25bf34d092539e01b020"}).forEach(function(oe){
		// Tianna
		otherextra.find({"trainer_id": "5a690da90379ce6d1fed04ac"}).forEach(function(oe){
		// DFG
		// otherextra.find({"trainer_id": "586f341b1cfef774222b1821"}).forEach(function(oe){
			if(err){
				console.error("oe Error: "+err);
			}
			// copyExtraImages(oe);
			delete oe._id;
			otherextra.db.collection("otherextra_migration").insert(oe, function(err, oe){
				if(err){
					console.error("oe Error: "+err);
				}
			});
			
		});
	}

});

// Before After Images Extra
Model.load('beforeafterimage', {}, function(err, beforeafterimage){

	if(err){
		console.error("Error1: "+err);
	}
	


	if(beforeafterimage){
		// FnT
		// beforeafterimage.find({"trainer_id": "57c5310521bbac1d01aa75db"}).forEach(function(bae){
		// TWL
		// beforeafterimage.find({"trainer_id": "584fbe1dadbdd05d535cddae"}).forEach(function(bae){
		// MN
		// beforeafterimage.find({"trainer_id": "58f66e596e288005867db979"}).forEach(function(bae){
		// MTC
		// beforeafterimage.find({"trainer_id": "5822bfb2b86828570dd90899"}).forEach(function(bae){
		// Z Body
		// beforeafterimage.find({"trainer_id": "5a848f72c3b5c3530a8d05f1"}).forEach(function(bae){
		// Holly Barker
		// beforeafterimage.find({"trainer_id": "5a3c25bf34d092539e01b020"}).forEach(function(bae){
		// Tianna
		// beforeafterimage.find({"trainer_id": "5a690da90379ce6d1fed04ac"}).forEach(function(bae){
		// Fit By Valen
		// beforeafterimage.find({"trainer_id": "5a9d7d110a4ae17da220a43e"}).forEach(function(bae){
		// Booth Camp
		beforeafterimage.find({"trainer_id": "5a8c7aff14d55f7ad445a6f3"}).forEach(function(bae){
		// DFG
		// beforeafterimage.find({"trainer_id": "586f341b1cfef774222b1821"}).forEach(function(bae){
			if(err){
				console.error("bae Error: "+err);
			}
			copyExtraImages(bae);
			delete bae._id;
			beforeafterimage.db.collection("beforeafterimage_migration").insert(bae, function(err, bae){
				if(err){
					console.error("bae Error: "+err);
				}
			});
			
		});
	}

})





