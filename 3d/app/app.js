'use strict';
/*global THREE: false */
// we use fs + brfs to inline an example XML document.
// exclude fs in package.json#browser + use the brfs transform
// to generate a clean browserified bundle
var fs = require('fs');
// var Snap = require('snapsvg');
var _ = require('lodash');


var pageControls = {
  diagram: 0
};

var diagrams = [
  fs.readFileSync(__dirname + '/../resources/pizza-collaboration.bpmn', 'utf-8'),
  fs.readFileSync(__dirname + '/../resources/sequentialMultiInstanceReceiveTask.bpmn20.xml', 'utf-8'),
  fs.readFileSync(__dirname + '/../resources/oneTaskProcess.bpmn20.xml', 'utf-8'),
  fs.readFileSync(__dirname + '/../resources/simple.bpmn', 'utf-8')
];

var diagramNames = [
  'pizza-collaboration',
  'sequentialMultiInstanceReceiveTask',
  'oneTaskProcess',
  'simple'
];

// require the viewer, make sure you added it to your project
// dependencies via npm install --save-dev bpmn-js
var BpmnViewer = require('bpmn-js');
var threeScene = require('./three-scene')(document.querySelector('#three-container .canvas'));
var scene = threeScene.scene;

var viewer = new BpmnViewer({ container: '#canvas' });
var flip = 180 * (Math.PI / 180);


document.getElementById('switch').addEventListener('click', function () {
  document.body.classList.toggle('canvas');
});







function makeMaterial(materialType, materialOptions) {
  var options = _.assign({
    color: 0xffffff
  }, materialOptions);
  return new THREE[materialType || 'MeshLambertMaterial'](options);
}





function createFaceMaterial(texturePath, materialType, materialOptions, texturedFace) {
  texturedFace = typeof texturedFace === 'undefined' ? 5 : texturedFace;
  var faces = [];
  var texture = THREE.ImageUtils.loadTexture(texturePath);

  var opts = _.assign({}, materialOptions, {
    color: 0xffffff,
    map: texture
  });

  for (var i = 0; i < 6; i++) {
    faces.push(makeMaterial(materialType, {
      color: 0x000000
    }));
  }
  faces[texturedFace] = makeMaterial(materialType, opts);

  return new THREE.MeshFaceMaterial(faces);
}







function addLane(options) {
  options = options || {};

  // var shape = new THREE.PlaneGeometry(maxX * scale, maxY * scale);
  // var mesh = new THREE.Mesh(shape, new THREE.MeshLambertMaterial({
  //   color: 0x999999,
  //   side: THREE.DoubleSide,
  //   transparent: true,
  //   opacity: 0.2
  // }));

  // mesh.position.set(x, y, options.height || 0);
  console.info('addLane', options);
  return [];
}

function addFlow(options) {
  options = options || {};

  var el = options.el,
      type = el.type,
      height = options.height || 50,
      radius = options.radius || 1,
      wps = el.waypoints,
      scale = options.scale || 1,
      material;

  var blackMaterial = makeMaterial('MeshPhongMaterial', options.materialOptions || {
    color: 0x000000
  });
  if (type.indexOf('Sequence') > -1) {
    material = blackMaterial;
  }
  else {
    var stripeTexture = THREE.ImageUtils.loadTexture('textures/stripe.png');
    stripeTexture.anisotropy = 1;
    stripeTexture.wrapS = stripeTexture.wrapT = THREE.RepeatWrapping;
    stripeTexture.repeat.set( 5, 1 );
    material = makeMaterial('MeshPhongMaterial', {
      map: stripeTexture,
      color: 0xffffff
    });
  }

  var group = new THREE.Object3D();

  wps.forEach(function (wp, i) {
    if (i === 0) {
      return;
    }
    var prevWp = wps[i - 1];

    var start = new THREE.Vector3(
      prevWp.x * scale,
      prevWp.y * scale,
      height * scale
    );
    var end = new THREE.Vector3(
      wp.x * scale,
      wp.y * scale,
      height * scale
    );

    var twoPointsCurve = new THREE.SplineCurve3([start, end]);
    var lineGeometry = new THREE.TubeGeometry(twoPointsCurve, 4, radius, 8, false);
    var lineMesh = new THREE.Mesh(lineGeometry, material);
    group.add(lineMesh);


    var junctionGeometry = new THREE.SphereGeometry(radius, 16, 16);
    var junctionMesh = new THREE.Mesh(junctionGeometry, blackMaterial);
    junctionMesh.position.set(
      prevWp.x * scale,
      prevWp.y * scale,
      height * scale
    );
    group.add(junctionMesh);
  });

  group.rotation.set(flip, flip, flip);

  return [group];
}


function addTask(options) {
  options = options || {};
  var x, y, z;

  var el = options.el,
      scale = options.scale || 1,
      height = options.height || 50;

  var material = createFaceMaterial('textures/task.png');

  var geometry = new THREE.BoxGeometry(el.width * scale, el.height * scale, height * scale);
  var mesh = new THREE.Mesh(geometry, material);


  x = (el.x + (el.width / 2)) * scale;
  y = (el.y + (el.height / 2)) * scale;
  z = scale * height;

  mesh.position.set(x, y, z);
  return [mesh];
}

function addEvent(options) {
  options = options || {};
  var x, y, z;

  var el = options.el,
      scale = options.scale || 1,
      height = options.height || 50;


  var material = createFaceMaterial('textures/event.png', null, null, 0);
  var geometry = new THREE.CylinderGeometry(el.width * scale, el.height * scale, height * scale);
  var mesh = new THREE.Mesh(geometry, material);

  x = (el.x + (el.width / 2)) * scale;
  y = (el.y + (el.height / 2)) * scale;
  z = scale * height;

  mesh.rotation.x = -90 * 0.0174532925;
  mesh.position.set(x, y, z);

  return [ mesh ];
}

function addGateway(options) {
  options = options || {};
  var x, y, z;

  var el = options.el,
      scene = options.scene,
      scale = options.scale || 1,
      height = options.height || 50;

  // var material = makeMaterial(options.materialType, options.materialOptions);
  var material = createFaceMaterial('textures/gateway.png', options.materialType, options.materialOptions);

  var geometry = new THREE.BoxGeometry(el.width * scale, el.height * scale, height * scale);
  var mesh = new THREE.Mesh(geometry, material);

  x = (el.x + (el.width / 2)) * scale;
  y = (el.y + (el.height / 2)) * scale;
  z = scale * height;

  mesh.position.set(x, y, z);
  mesh.rotation.z = 45 * 0.0174532925;
  scene.add(mesh);

  return [ mesh ];
}

var sceneMeshes = [];

function clearScene() {
  sceneMeshes.forEach(function (mesh) {
    scene.remove(mesh);
  });

  sceneMeshes = [];
}

function loadBpmn(num) {
  num = diagramNames.indexOf(num);
  console.info('using diagram num', num);
  document.body.classList.add('loading');
  clearScene();
  viewer.importXML(diagrams[num], function(err) {
    document.body.classList.remove('loading');

    if (err) {
      console.log('something went wrong:', err);
    }

    var canvas = viewer.get('canvas');

    canvas.zoom('fit-viewport');


    var root = canvas.getRootElement();


    var layers = {};

    var layerNumber = 0;

    function isLabel(element) {
      return element.type === 'label' && !element.businessObject.name;
    }

    function hasCoords(shape) {
      return shape.x &&
             shape.y &&
             shape.width &&
             shape.height;
    }

    var maxX = 0,
        minX = 0,
        maxY = 0,
        minY = 0;

    function traverse(children) {
      if (!children) {
        alert('the diagram is fucked up');
        return;
      }
      var tempLayers = [];

      if (children.length === 0) {
        return;
      }

      layers['layer' + layerNumber] = [];

      _.forEach(children, function (child) {
        if (isLabel(child)) {
          return;
        }

        layers['layer' + layerNumber ].push(child);

        if (hasCoords(child)) {
          minX = Math.min(child.x, minX);
          maxX = Math.max(child.x + child.width, maxX);
          minY = Math.min(child.y, minY);
          maxY = Math.max(child.y + child.height, maxY);
        }

        _.forEach(child.children || [], function(elem) {
            tempLayers.push(elem);
        });
      });

      if (tempLayers.length === 0) {
        return;
      }
      layerNumber += 1;

      traverse(tempLayers);
    }

    traverse(root.children);

    var height = 50;
    var scale = 0.2;

    function createElementMesh(el, depth) {
      var created = [];
      var type = el.type;

      var options = {
        el: el,
        scene: scene,
        scale: scale,
        depth: depth,
        height: height
      };

      function has(stuff, what) {
        return stuff.indexOf(what) > -1;
      }

      if (has(el.parent.id, 'SubProcess')) {
        options.height *= 2;
      }

      if (has(type, 'Gateway')) {
        created = created.concat(addGateway(options));
      }
      else if (has(type, 'Flow')) {
        created = created.concat(addFlow(options));
      }
      else if (has(type, 'Event')) {
        created = created.concat(addEvent(options));
      }
      else if (has(type, 'Task') || has(type, 'SubProcess')) {
        created = created.concat(addTask(options));
      }
      // else if (has('Participant')) {
      //   options.height = (height / 10) * depth;
      //   created = created.concat(addTask(options));
      // }
      else if (has('Lane')) {
        created = created.concat(addLane(options));
      }
      else {
        console.info('unknow type', type);
      }

      return created;
    }

    var names = Object.keys(layers);

    _.forEach(names, function (name, d) {
      var shapes = layers[name];
      _.forEach(shapes, function (shape) {
        var group = new THREE.Object3D();
        createElementMesh(shape, d).forEach(function (mesh) {
          group.add(mesh);
        });

        group.rotation.set(flip, 0, 0);

        group.translateY(maxY * (-1 * scale));
        group.translateZ((scale * height) * -2);
        scene.add(group);

        sceneMeshes.push(group);
      });
    });
  });
}

loadBpmn(diagramNames[0]);

threeScene.gui.add(pageControls, 'diagram', diagramNames).onChange(loadBpmn);

