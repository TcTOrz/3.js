/*
 * @Author: Li Jian
 * @Date: 2021-12-20 14:18:22
 * @LastEditTime: 2021-12-21 15:27:39
 * @LastEditors: Li Jian
 * @Description: 光缆
 */
import * as THREE from '../node_modules/three/build/three.module.js'
import basic from '../data/basic.js'

function renderFiber(scene, positions) {
  const point = new THREE.Vector3()
  let splinePointsLength = 3
  const splineHelperObjects = []
  const ARC_SEGMENTS = 200
  const splines = {}
  const geometry = new THREE.BufferGeometry()
  function addSplineObject(position) {
    const material = new THREE.MeshLambertMaterial({
      color: Math.random() * 0xffffff,
    })
    const object = new THREE.Mesh(geometry, material)

    object.position.copy(position)
    // object.castShadow = true
    // object.receiveShadow = true
    scene.add(object)
    splineHelperObjects.push(object)
    return object
  }
  for (let i = 0; i < splinePointsLength; i++) {
    addSplineObject(positions[i])
  }
  positions.length = 0

  for (let i = 0; i < splinePointsLength; i++) {
    positions.push(splineHelperObjects[i].position)
  }

  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(ARC_SEGMENTS * 3), 3)
  )

  let curve = new THREE.CatmullRomCurve3(positions)
  // curve.curveType = 'catmullrom'
  // curve.mesh = new THREE.Line(
  //   geometry.clone(),
  //   new THREE.LineBasicMaterial({
  //     color: 0xff0000,
  //     opacity: 0.35,
  //   })
  // )
  // // curve.mesh.castShadow = true
  // splines.uniform = curve

  // curve = new THREE.CatmullRomCurve3(positions)
  // curve.curveType = 'centripetal'
  // curve.mesh = new THREE.Line(
  //   geometry.clone(),
  //   new THREE.LineBasicMaterial({
  //     color: 0x00ff00,
  //     opacity: 0.35,
  //   })
  // )
  // curve.mesh.castShadow = true
  // splines.centripetal = curve

  curve = new THREE.CatmullRomCurve3(positions)
  curve.curveType = 'chordal'
  curve.mesh = new THREE.Line(
    geometry.clone(),
    new THREE.LineBasicMaterial({
      color: 0x7f7f7f,
    })
  )
  curve.mesh.castShadow = true
  splines.chordal = curve

  for (const k in splines) {
    const spline = splines[k]
    scene.add(spline.mesh)
  }

  function load() {
    for (const k in splines) {
      const spline = splines[k]

      const splineMesh = spline.mesh
      const position = splineMesh.geometry.attributes.position

      for (let i = 0; i < ARC_SEGMENTS; i++) {
        const t = i / (ARC_SEGMENTS - 1)
        spline.getPoint(t, point)
        position.setXYZ(i, point.x, point.y, point.z)
      }

      position.needsUpdate = true
    }
  }

  load()
}

// 只考虑在杆塔在Z轴上的情况
let distance // 电缆之间的间距
function fiberDistance(group, scaler) {
  if (distance) return distance
  distance = (group.userData.from.z * 2 * scaler) / 5
  return distance
}

function makeFiber(scene, groups, group) {
  // console.log(groups, group)
  const { scaler } = basic.tower
  fiberDistance(group, scaler)

  const { userData } = group
  const toIds = userData.info.fiber.to
  toIds.map((id, idx) => {
    // console.log(id, idx)
    const to = groups.find((g) => g.userData.info.id === id)
    if (to.length === 0) return // 没有匹配,说明数据有问题
    // console.log(distance)
    // 从group出发电缆
    const toVector3 = userData.to
      .clone()
      .multiplyScalar(scaler)
      .add(group.position)
    toVector3.z = toVector3.z - idx * distance
    // groups中接收的电缆
    const fromVector3 = to.userData.from
      .clone()
      .multiplyScalar(scaler)
      .add(to.position)
    // const toIdx = to.userData.info.fiber.from.findIndex((id) => id === id)
    // fromVector3.z = fromVector3.z - toIdx * distance
    fromVector3.z = fromVector3.z - idx * distance

    const middleVector3 = fromVector3.clone().add(toVector3).divideScalar(2)
    // const random = Math.random() * 0.2 + 1 // 下摆幅度 1-1.2
    middleVector3.y = middleVector3.y / 1.1
    renderFiber(scene, [toVector3, middleVector3, fromVector3])
  })
}

export default makeFiber
