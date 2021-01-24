var map = new AMap.Map('container', {
    mapStyle: 'amap://styles/normal',
    resizeEnable: true,
    showLabel: true, //显示地图文字标记
    layers: [
        new AMap.TileLayer(),
        // new AMap.TileLayer.Satellite(),
        new AMap.TileLayer.RoadNet()
    ],
    zooms: [1, 100],
    zoom: 10,
    zIndex: 1,
    center: [116.397428, 39.90923],//中心点坐标
    pitch: 75,
    resizeEnable: true,
    rotateEnable: true,
    pitchEnable: true,
    expandZoomRange: true,
    buildingAnimation: true,//楼块出现是否带动画
    viewMode: '3D'//使用3D视图
});