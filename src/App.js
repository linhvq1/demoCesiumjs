import React from "react";
import {
  Ion,
  Viewer,
  createWorldTerrain,
  Cartesian3,
  Color,
  defined,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  ColorMaterialProperty,
  Entity,
  PointGraphics,
  PolylineGraphics,
  PolygonGraphics,
} from "cesium";

function App() {
  // Your access token can be found at: https://com/ion/tokens.
  // This is the default access token
  Ion.defaultAccessToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1MDEzZmIzZC02Mjg2LTRkYzctYTA2OC03NjZiMTIzOWU5ZmEiLCJpZCI6MTI5Mzk0LCJpYXQiOjE2NzkyNzkxNzd9.py3wkN3X__f-hIC5640AUIETxpwq5ojaHejtV5Dz2LQ";

  const viewer = new Viewer("cesiumContainer", {
    terrainProvider: createWorldTerrain(),
  });

  fetch("https://s3.amazonaws.com/CMSTest/squaw_creek_container_info.xml")
    .then((response) => response.text())
    .then((data) => {
      let parser = new DOMParser();
      let xml = parser.parseFromString(data, "text/xml");
      let allPoint = xml.getElementsByTagName("POINT");
      let allLine = xml.getElementsByTagName("LINE");
      let allFace = xml.getElementsByTagName("FACE");
      let height = 250;

      let pointArr = [];
      /* Tạo điểm */
      for (let i = 0; i < allPoint.length; i++) {
        let id = allPoint[i].getAttribute("id");
        let dataPoint = allPoint[i].getAttribute("data");
        pointArr.forEach((j) => {
          j = new Entity();
          j.name = "Point number #" + j + " ID: " + id;
          j.show = false;
          j.description = Cartesian3.fromDegrees(
            Number(dataPoint.split(",")[0].trim()),
            Number(dataPoint.split(",")[1].trim()),
            height
          );
          j.position = Cartesian3.fromDegrees(
            Number(dataPoint.split(",")[0].trim()),
            Number(dataPoint.split(",")[1].trim()),
            height
          );
          const newPoint = new PointGraphics();
          newPoint.color = Color.BLUE;
          newPoint.pixelSize = 3;
          j.point = newPoint;
          viewer.entities.add(j);
        });
      }

      /**
       * Lấy id của một line và trả về một mảng tọa độ x và y của hai điểm tạo thành đường thẳng
       * tham số id - Id của line muốn lấy độ.
       * returns về một mảng gồm 4 số.
       */
      function returnDegreesForLine(id) {
        let dataPointArr;
        /* Lặp qua allLine và lấy id và path của từng line. */
        for (let i of allLine) {
          let lineId = i.getAttribute("id");
          let data = i.getAttribute("path");
          if (id == lineId) {
            dataPointArr = data;
          }
        }

        console.log(dataPoint);

        let j = 0;
        /* Lấy tọa độ hai điểm tạo thành đoạn thẳng. */
        const arr = [0, 0, 0, 0];
        for (let i = 0; i < allPoint.length; i++) {
          let pointID = allPoint[i].getAttribute("id");
          if (
            dataPointArr.split(",")[0].trim() == pointID ||
            dataPointArr.split(",")[1].trim() == pointID
          ) {
            let dataPoint = allPoint[i].getAttribute("data");
            arr[j] = Number(dataPoint.split(",")[0].trim());
            arr[j + 1] = Number(dataPoint.split(",")[1].trim());
            j += 2;
          }
        }
        return arr;
      }

      let lineArr = [];
      /* Tạo đường thẳng */
      for (let i = 0; i < allLine.length; i++) {
        let lineId = allLine[i].getAttribute("id");
        lineArr[i] = new Entity();
        lineArr[i].name = "line number #" + lineArr[i] + " ID: " + lineId;
        lineArr[i].show = false;
        const newLine = new PolylineGraphics();
        newLine.positions = new Cartesian3.fromDegreesArray(
          returnDegreesForLine(lineId)
        );
        newLine.clampToGround = true;
        newLine.width = 2;
        newLine.material = new ColorMaterialProperty(Color.AQUA.withAlpha(0.5));
        lineArr[i].polyline = newLine;
        viewer.entities.add(lineArr[i]);
      }

      const scene = viewer.scene;
      /* Chức năng cho phép nhấp vào đa giác và thay đổi màu sắc của đa giác đó. */
      const handler = new ScreenSpaceEventHandler(scene.canvas);
      handler.setInputAction((movement) => {
        const pick = scene.pick(movement.position);
        if (defined(pick)) {
          const entity = viewer.entities.getById(pick.id.id);
          entity.polygon.material = new ColorMaterialProperty(
            Color.BROWN.withAlpha(0.5)
          );
        }
      }, ScreenSpaceEventType.LEFT_CLICK);

      /**
       * Lặp qua arr và kiểm tra xem giá trị có trong arr không
       * tham số arr là Mảng để tìm kiếm
       * tham số value là Giá trị cần tìm kiếm.
       * trả về true hoặc false tùy thuộc vào giá trị có trong mảng hay không.
       */
      function contains(arr, value) {
        var i = arr.length;
        while (i--) {
          if (arr[i].trim() === value) {
            return true;
          }
        }
        return false;
      }

      /**
       * Trả về độ của các đường tạo nên face
       * tham số id là Id của face.
       * trả về một mảng độ cho mỗi đường trên face.
       */
      function returnDegreesForFace(id) {
        let j = 0;
        const arr = [];
        /* Lặp qua allLine và kiểm tra xem id của line có nằm trong path của faces không. Nếu như thỏa mãn điều kiện
    data sẽ nhận được độ của line và thêm vào arr. */
        for (let i = 0; i < allLine.length; i++) {
          let lineId = allLine[i].getAttribute("id");
          if (contains(id.split(","), lineId)) {
            const data = returnDegreesForLine(lineId);
            arr[j] = data[0];
            arr[j + 1] = data[1];
            arr[j + 2] = data[2];
            arr[j + 3] = data[3];
            j += 2;
          }
        }

        /* Hoán đổi hai phần tử cuối của mảng. */
        let lt = arr.length;
        let temp1 = arr[lt - 4];
        let temp2 = arr[lt - 3];
        arr[lt - 4] = arr[lt - 2];
        arr[lt - 3] = arr[lt - 1];
        arr[lt - 2] = temp1;
        arr[lt - 1] = temp2;

        console.log(lt);
        return arr;
      }

      var listFace = [];
      /* Tạo đa giác. */
      for (let i = 0; i < allFace.length; i++) {
        var listDataLine =
          allFace[i].getElementsByTagName("POLYGON")[0].attributes[1].value;
        var FaceID = allFace[i].getAttribute("id");
        listFace[i] = new Entity();
        listFace[i].name = "Face number #" + i + " ID: " + FaceID;
        listFace[i].description =
          "Face position: " +
          Cartesian3.fromDegreesArray(returnDegreesForFace(listDataLine));
        const newFace = new PolygonGraphics();
        newFace.hierarchy = Cartesian3.fromDegreesArray(
          returnDegreesForFace(listDataLine)
        );
        newFace.height = 250;
        newFace.material = new ColorMaterialProperty(Color.AQUA.withAlpha(0.5));
        newFace.outlineColor = Color.WHITE;
        newFace.outline = true;
        listFace[i].polygon = newFace;
        viewer.entities.add(listFace[i]);
      }
      viewer.zoomTo(listFace[0]);

      /**
      Nhận vào một mảng gồm 4 số và trả về một đối tượng có tọa độ x và y của trung điểm
    * của đoạn thẳng được xác định bởi hai số đầu và hai số cuối trong mảng
    * arr - một mảng gồm 4 số, biểu thị tọa độ x và y của hai điểm.
    * trả về một đối tượng có hai thuộc tính, x và y.
    */
      function findMidPoint(arr) {
        let x = (arr[0] + arr[2]) / 2;
        let y = (arr[1] + arr[3]) / 2;
        return { x, y };
      }
      var midPointArr = [];

      /* Tạo trung điểm cho mỗi line. */
      for (let i = 0; i < lineArr.length; i++) {
        let lineId = allLine[i].getAttribute("id");
        var dataPoint = findMidPoint(returnDegreesForLine(lineId));
        midPointArr[i] = new Entity();
        midPointArr[i].name = "Point number #" + i;
        midPointArr[i].show = true;
        midPointArr[i].description = Cartesian3.fromDegrees(
          Number(dataPoint.x),
          Number(dataPoint.y),
          height
        );
        midPointArr[i].position = Cartesian3.fromDegrees(
          Number(dataPoint.x),
          Number(dataPoint.y),
          height
        );
        const newPoint = new PointGraphics();
        newPoint.color = Color.YELLOW;
        newPoint.pixelSize = 3;
        midPointArr[i].point = newPoint;
        viewer.entities.add(midPointArr[i]);
      }
    });

  return <div></div>;
}

export default App;
