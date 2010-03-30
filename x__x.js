
var xωx = xωx || false;

if ( !xωx ) {

    xωx = (function(){

        // private member
        var
            _div                // display element id
           ,_address            // target address
           ,_lat                // 緯度
           ,_lon                // 経度
           ,_zoom               // zoom level
           ,_line_color         // polyline color
           ,_map_type_id        // map type
           ,_map                // map object
           ,geo                 // geocorder object

           ,_marker_mst   = []  // マーカーマスタ
           ,_infowin_mst  = []  // フキダシマスタ
           ,_line_mst     = []  // ラインマスタ
           ,_line_mst_fix = []  // ラインマスタ(fix)

           // map type
           ,_map_type = {
               '地図'         : 'ROADMAP'
              ,'航空写真'     : 'SATELLITE'
              ,'ハイブリッド' : 'HYBRID'
              ,'地形'         : 'TERRAIN'
            }

           // カラーマスタ
           ,_color_mst = {
                青 : '#00f'
               ,赤 : '#f00'
               ,緑 : '#0f0'
            }

        ;


        // public methid
        return {
            表示要素のID : function (id) {
                if ( !id ) return;
                _div = id;
                return this;
            }
           ,住所で表示 : function (t) {
                if ( !t ) return;
                _address = t;
                return this;
            }
           ,緯度 : function (t) {
                if ( !t || !numFormatChk(t, '^[\\d\\.]+$') ) return;
                _lat = t;
                return this;
            }
           ,経度 : function (t) {
                if ( !t || !numFormatChk(t, '^[\\d\\.]+$') ) return;
                _lon = t;
                return this;
            }
           ,ズームレベル : function (z) {
                if ( !z || !numFormatChk(z, '^\\d+$') || !(0<=z && z<=19) ) return;
                _zoom = z;
                return this;
            }
           ,マップの種類 : function (t) {
                if ( !t || !_map_type[t] ) return;
                _map_type_id = _map_type[t];
                return this;
            }
           ,マーカー追加 : function (p, m) {
                if ( !p ) return;
                // 住所か座標かで追加ハッシュを変更する
                var d = getOverlayData(p, m);
                if ( !d ) return;
                // スタック
                _marker_mst.push(d);
                return this;
            }
           ,フキダシ追加 : function (p, m) {
                if ( !p ) return;
                // 住所か座標かで追加ハッシュを変更する
                var d = getOverlayData(p, m);
                if ( !d ) return;
                // スタック
                _infowin_mst.push(d);
                return this;
            }
           ,ラインを引く : function () {
                for ( var i=0,l=arguments.length; i<l; i++ ) {
                    _line_mst.push(getOverlayData(arguments[i]));
                }
                return this;
            }
           ,ラインの色 : function (p) {
                _line_color = p;
                return this;
            }
           ,マップ表示 : function () {
                if ( !_div || !google || !google.maps ) return;
                google.maps.event.addDomListener(window, 'load', function () {
                    mapdiv = document.getElementById(_div);
                    _geo   = new google.maps.Geocoder();

                    // 緯度経度が指定されている場合は住所指定よりも優先
                    if ( _lat && _lon ) {
                        var opt = {
                            zoom         : _zoom || 16
                           ,center       : new google.maps.LatLng(_lat, _lon)
                           ,mapTypeId    : (_map_type_id) ? google.maps.MapTypeId[_map_type_id] : google.maps.MapTypeId.ROADMAP
                           ,scaleControl : true
                        };
                        _map = new google.maps.Map(mapdiv, opt);

                    // 緯度経度が指定されていない場合で、かつ住所が指定されている場合
                    } else if ( _address ) {
                        _geo.geocode( { 'address' : _address
                                       ,'country' : 'ja'}
                                     ,function (res, status) {
                                          myLatLng = res[0].geometry.location;
                                          opt = {
                                              zoom         : _zoom || 16
                                             ,center       : myLatLng
                                             ,mapTypeId    : (_map_type_id) ? google.maps.MapTypeId[_map_type_id] : google.maps.MapTypeId.ROADMAP
                                             ,scaleControl : true
                                          };
                                          _map = new google.maps.Map(mapdiv, opt);
                                      }
                        );

                    } else {
                        return;
                    }

                    // マーカーとかフキダシとかラインとか一気に表示
                    addOverlay();

                });
            }
        };


        /**
         * overlay 追加関数
         */

        function addOverlay () {
            // マーカー追加
            for ( var i=0,l=_marker_mst.length; i<l; i++ ) {

                // p キーがある場合は住所表示
                if ( _marker_mst[i].p ) {
                    _geo.geocode( { 'address' : _marker_mst[i].p
                                   ,'country' : 'ja'}
                                 ,(function(_i){
                                      return function (res, status) {
                                                 myLatLng = res[0].geometry.location;
                                                 var marker = new google.maps.Marker({
                                                         position : myLatLng
                                                        ,map      : _map
                                                        ,title    : _marker_mst[_i].m || ''
                                                 });
                                             }
                                  })(i)
                    );

                // それ以外は座標表示
                } else {
                    var marker = new google.maps.Marker({
                                         position : new google.maps.LatLng(_marker_mst[i].lat, _marker_mst[i].lon)
                                        ,map      : _map
                                        ,title    : _marker_mst[i].m || ''
                                 });
                }

            }


            // フキダシ追加
            for ( var i=0,l=_infowin_mst.length; i<l; i++ ) {

                // pキーがある場合は住所表示
                if ( _infowin_mst[i].p ) {
                    _geo.geocode( { 'address' : _infowin_mst[i].p
                                   ,'country' : 'ja'}
                                 ,(function(_i){
                                      return function (res, status) {
                                                 myLatLng = res[0].geometry.location;
                                                 // marker
                                                 var marker = new google.maps.Marker({
                                                         position : myLatLng
                                                        ,map      : _map
                                                        ,title    : _infowin_mst[_i].m || ''
                                                 });
                                                 // info window
                                                 var infowindow = new google.maps.InfoWindow({
                                                     content : _infowin_mst[_i].m
                                                    ,size    : new google.maps.Size(200, 60)
                                                 });
                                                 google.maps.event.addListener(marker, 'click', function(){
                                                     infowindow.open(_map, marker);
                                                 })
                                             }
                                  })(i)
                    );

                // それ以外は座標表示
                } else {
                    var marker = new google.maps.Marker({
                                         position : new google.maps.LatLng(_infowin_mst[i].lat, _infowin_mst[i].lon)
                                        ,map      : _map
                                        ,title    : _infowin_mst[i].m || ''
                                 });
                    // info window
                    var infowindow = new google.maps.InfoWindow({
                                         content : _infowin_mst[_i].m
                                        ,size    : new google.maps.Size(200, 60)
                                     });
                    google.maps.event.addListener(marker, 'click', function(){
                        infowindow.open(_map, marker);
                    })
                }

            }


            // ライン追加
            for ( var i=0,l=_line_mst.length; i<l; i++ ) {
                if ( _line_mst[i].lat ) {
                    _line_mst_fix.push( new google.maps.LatLng(_line_mst[i].lat, _line_mst[i].lon) );
                }
            }
            // construct the polyline
            pLine = new google.maps.Polyline({
                path          : _line_mst_fix
               ,strokeColor   : _color_mst[_line_color] || '#f00'
               ,strokeOpacity : 0.8
               ,strokeWeight  : 2
            });
            pLine.setMap(_map);

        }


        /**
         * overlay データ取得関数
         * マーカーやフキダシ用のデータハッシュを返却
         */

        function getOverlayData (p, m) {
            // 座標指定の判断
            // 座標指定の場合
            if ( isGeoData(p) ) {
                var geo = p.split(' ');
                return {
                    lat : geo[0]
                   ,lon : geo[1]
                   ,m   : m
                };

            // 座標以外は住所であるとして扱う
            } else {
                return {
                    p : p
                   ,m : m
                };
            }
        }


        /**
         * 数値チェック関数
         */

        function numFormatChk (v, reg) {
            if ( typeof(v) == 'string' ) return;
            return String(v).match(reg);
        }


        /**
         * 座標チェック
         */

        function isGeoData (p) {
            return p.match(/^[\d\.] [\d\.]+$/);
        }

    })();

}

