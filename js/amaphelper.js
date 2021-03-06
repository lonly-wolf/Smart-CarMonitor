var startPosInfo = new AMap.LngLat(116, 39);

var endPosInfo;
var sourceMarkArray = [];
var dstMarkArray = [];
var locationObject
var mapObject
var routeObject = false

var timer
var timer2
var hasMoved

function setActionMoved(moved) { hasMoved = moved }

function initialAMap() {
  hasMoved = false
  var map = new AMap.Map('container', {
    mapStyle : 'amap://styles/normal',
    resizeEnable : true,
    showLabel : true, //显示地图文字标记
    layers : [
      new AMap.TileLayer(),
      // new AMap.TileLayer.Satellite(),
      new AMap.TileLayer.RoadNet()
    ],
    zooms : [ 1, 100 ],
    zoom : 10,
    zIndex : 1,
    center : [ 116.397428, 39.90923 ], //中心点坐标
    pitch : 0,
    resizeEnable : true,
    rotateEnable : false,
    pitchEnable : false,
    expandZoomRange : false,
    buildingAnimation : false, //楼块出现是否带动画
    viewMode : '2D'            //使用3D视图
  });

  // add real time traffic info to map
  var tarfficLayer = new AMap.TileLayer.Traffic({
    zIndex : 10,
    'autoRefresh' : true, //是否自动刷新，默认为false
    'interval' : 30,      //刷新间隔，默认180s
  });
  map.add(tarfficLayer);
  return map;
}

function initialAMapPlugins(map) {
    // load AMap's plugin async
    AMap.plugin('AMap.Geolocation', function() {
      // add location module
      var geolocation = new AMap.Geolocation({
        enableHighAccuracy : true, //是否使用高精度定位，默认:true
        timeout : 30000,           //超过30秒后停止定位，默认：5s
        buttonPosition : 'RB',     //定位按钮的停靠位置
        buttonOffset : new AMap.Pixel(
            10, 20), //定位按钮与设置的停靠位置的偏移量，默认：Pixel(10, 20)
        zoomToAccuracy : false, //定位成功后是否自动调整地图视野到定位点
        panToLocation : false
      });
      map.addControl(geolocation);
      locationObject = geolocation

      // bind location call back method
      geolocation.getCurrentPosition(function(status, result) {
        if (status == 'complete') {
          onComplete(result)
        } else {
          onError(result)
        }
      });

      mapObject = map

      timer = setInterval(function() {
        console.log('Ready to get current position......');
        // bind location call back method
        locationObject.getCurrentPosition(function(status, result) {
          if (status == 'complete') {
            onComplete(result)
          } else {
            onError(result)
          }
        });
      }, 2000);

      timer2 = setInterval(function() {
        console.log('Ready to draw route.....');
        // bind location call back method
        if (!hasMoved) {
          updateStartAddress(startPosInfo)
        }
      }, 20000);
    });

    //输入提示 目的地
    var autoOptions = {input : "tipinput"};

    //输入提示 出发地
    var autoOptions2 = {input : "tipinput2"};

    AMap.plugin([ 'AMap.PlaceSearch', 'AMap.AutoComplete' ], function() {
      var auto = new AMap.AutoComplete(autoOptions);
      var placeSearch = new AMap.PlaceSearch({map : map}); //构造地点查询类
      auto.on("select", select); //注册监听，当选中某条记录时会触发
      function select(e) {
        placeSearch.setCity(e.poi.adcode);
        placeSearch.search(e.poi.name, function(status, data) {
          if (status !== 'complete')
            return;
          var pois = data.poiList.pois;
          for (var i = 0; i < pois.length; ++i) {
            var marker = new AMap.Marker({
              content : '<div class="marker" >' + i + '</div>',
              position : pois[i].location,
              map : map,
              label : {
                offset : new AMap.Pixel(5, 0), //修改label相对于maker的位置
                content : "设为目的地"
              }
            });

            dstMarkArray.push(marker);

            marker.id = pois[i].id;
            marker.name = pois[i].name;
            marker.on('click', function() {
              endPosInfo = this.getPosition();
              drawRoutingPath(map, startPosInfo, endPosInfo);
              console.log("目的地:Selected:" + this.name +
                          " pos:" + this.getPosition());

              dstMarkArray.forEach(it => { it.hide(); });
              this.hide();
              map.detailOnAMAP({
                name : this.name,
                location : this.getPosition(),
                id : this.id
              })
            })
          }
        }); //关键字查询查询
      }
    }); // Ended AMap.plugin

    mapObject = map
}

function drawRoutingPath(map, startPos, endPos) {
  if (routeObject instanceof Object) {
    console.log('Ready to destory......')
    routeObject.destroy()
    console.log('destory finished!')
  }
    // add path editing
    map.plugin('AMap.DragRoute', function () {
        // path 是驾车导航的起、途径和终点，最多支持16个途经点
        var path = []

        path.push([startPos.lng, startPos.lat])
        path.push([endPos.lng, endPos.lat])

        routeObject =
            new AMap.DragRoute(map, path, AMap.DrivingPolicy.LEAST_FEE)
        // 查询导航路径并开启拖拽导航
        routeObject.search()
    }) // end path editing
}

function addDrivingPlugins(pathArray) {
    // add driving plugins
    // add Driving Bar
    AMap.plugin('AMap.Driving', function () {
        var driving = new AMap.Driving({
            zIndex: 12,
            policy: AMap.DrivingPolicy.LEAST_TIME,
            buttonOffset: new AMap.Pixel(10, 20),//定位按钮与设置的停靠位置的偏移量，默认：Pixel(10, 20)
        });

        driving.search(pathArray, function (status, results) {

        });
    });
}

function updateMonitorData(map, capitals) {
    // ready to load monitor data
    var title = '详细';
    var infoWindowArr = [],
        facilities = [];

    for (var i = 0; i < capitals.length; i++) {

        var color = 'rgba(255,0,0,1)';
        if (capitals[i].aa == 1)
            color = 'rgba(,0,255,1)';

        var marker = new AMap.CircleMarker({
            radius: 6,//3D视图下，CircleMarker半径不要超过64px
            strokeColor: 'white',
            strokeWeight: 2,
            strokeOpacity: 0.5,
            fillColor: color,
            fillOpacity: 0.5,
            zIndex: 20,
            bubble: true,
            cursor: 'pointer',
            clickable: true,
            center: [capitals[i].center[0], capitals[i].center[1]], //位置
            text: 'Monitor'
        })

        facilities.push(marker);
    }

    map.add(facilities);
}

//解析定位结果
function onComplete(data) {
    document.getElementById('status').innerHTML = '定位成功'
    var str = [];
    startPosInfo = data.position
    str.push('定位结果：' + data.position);
    str.push('定位类别：' + data.location_type);
    if (data.accuracy) {
        str.push('精度：' + data.accuracy + ' 米');
    }//如为IP精确定位结果则没有精度信息
    str.push('是否经过偏移：' + (data.isConverted ? '是' : '否'));
    document.getElementById('result').innerHTML = str.join('<br>');
    console.log(str)
}

function updateStartAddress(posInfo) {
    drawRoutingPath(mapObject, startPosInfo, endPosInfo)
}

//解析定位错误信息
function onError(data) {
    document.getElementById('status').innerHTML = '定位失败'
    document.getElementById('result').innerHTML = '失败原因排查信息:' + data.message;
    console.log('Failed to locate!')
}

//构建自定义信息窗体
function createInfoWindow(map, title, content) {
    var info = document.createElement("div");
    info.className = "custom-info input-card content-window-card";

    //可以通过下面的方式修改自定义窗体的宽高
    info.style.width = "300px";
    // 定义顶部标题
    var top = document.createElement("div");
    var titleD = document.createElement("div");
    var closeX = document.createElement("span");
    top.className = "info-top";
    titleD.innerHTML = title;
    closeX.innerHTML = "&times;";
    closeX.className = "closeX";
    closeX.onclick = closeInfoWindow;

    top.appendChild(titleD);
    top.appendChild(closeX);
    info.appendChild(top);

    // 定义中部内容
    var middle = document.createElement("div");
    middle.className = "info-middle";
    middle.style.backgroundColor = 'white';
    middle.innerHTML = content;
    info.appendChild(middle);

    // 定义底部内容
    var bottom = document.createElement("div");
    bottom.className = "info-bottom";
    var sharp = document.createElement("span");
    sharp.className = "sharp";
    bottom.appendChild(sharp);
    info.appendChild(bottom);
    return info;
}
//关闭信息窗体
function closeInfoWindow(map) {
    map.clearInfoWindow();
}