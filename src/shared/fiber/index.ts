/*
 * @Author: Li Jian
 * @Date: 2022-02-21 09:30:39
 * @LastEditTime: 2022-04-25 10:48:28
 * @LastEditors: Li Jian
 */
import { FiberInterface } from './type'
import * as THREE from 'three'
import siteBg from '@assets/image/site-bg.jpg?url'
import planeBg from '@assets/image/plane-bg.jpg?url'
import {
  resizeRendererToDisplaySize,
  makePerspectiveCamera,
  loadGltfModel,
  makeEvent,
} from '@/shared'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Tower from '/blender/塔杆/corset-power-transmission-tower.gltf?url'
import MountainsAndRivers from '/blender/山川河流/山川河流.gltf?url'
import SmallSite from '/blender/homeicon/homeicon.gltf?url'

export default class Fiber<T extends HTMLCanvasElement> implements FiberInterface {
  canvas: T
  renderer!: THREE.WebGLRenderer
  scene!: THREE.Scene
  camera!: THREE.PerspectiveCamera
  cameraPosition: THREE.Vector3Tuple = [30, 40, 50]
  textureLoader: THREE.TextureLoader = new THREE.TextureLoader()
  control!: OrbitControls
  mouse: THREE.Vector2 = new THREE.Vector2()
  INTERSECTED: any
  raycaster = new THREE.Raycaster()
  constructor(canvas: T) {
    this.canvas = canvas
    this.init()
    this.load()
    this.event()
    this.render()
    return this
  }
  init() {
    this.initRenderer()
    this.initScene()
    this.initCamera()
    this.initLight()
    this.initControl()
  }
  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
    })
  }
  initScene() {
    this.scene = new THREE.Scene()
    this.textureLoader.load(siteBg, texture => {
      const rt = new THREE.WebGLCubeRenderTarget(texture.image.height)
      rt.fromEquirectangularTexture(this.renderer, texture)
      this.scene.background = rt.texture
    })
  }
  initCamera() {
    this.camera = makePerspectiveCamera(
      70,
      this.canvas.clientWidth / this.canvas.clientHeight,
      0.1,
      1000,
      this.cameraPosition
    )
  }
  initLight() {
    // const skyColor = 0xb1e1ff // light blue
    // const groundColor = 0xb97a20 // brownish orange
    // const intensity = 1
    // const light = new THREE.HemisphereLight(skyColor, groundColor, intensity)
    // this.scene.add(light)
    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(0, 70, 50)
    this.scene.add(light)
  }
  initControl() {
    const control = (this.control = new OrbitControls(this.camera, this.canvas))
    control.target.set(0, 0, 0)
    control.maxDistance = 200 // 视野距离
    // 垂直角度
    // control.maxPolarAngle = Math.PI / 3
    // control.minPolarAngle = -Math.PI / 3
    control.enableDamping = true // 阻尼
    control.dampingFactor = 0.05 // 阻尼系数
    // controls.screenSpacePanning = true // 允许平移
  }
  async load() {
    // this.loadPlatform()
    this.loadPlatformNew()
    await this.loadTower()
    await this.loadSmallSite()
  }
  loadTower() {
    const towers = [
      // 杆塔数组
      {
        id: 1, // 杆塔id
        name: '杆塔1', // 杆塔名称
        position: [-50, 10, 30], // 杆塔位置
        // rotation: [0, 0, 0], // 杆塔旋转角度
        // scale: [1, 1, 1], // 杆塔缩放比例
        fiber: {
          // 杆塔电缆
          from: [], // 起始电缆 - 电缆id - 可以为空数组, 如果为空数组, 则表示该杆塔是起始电缆
          to: [2, 2, 2, 2, 2, 2], // 终止电缆 - 电缆id - 可以为空数组, 如果为空数组, 则表示该杆塔是终止电缆
        },
      },
      {
        id: 2,
        name: '杆塔2',
        position: [0, 7, 30],
        fiber: {
          from: [1, 1, 1, 1, 1, 1],
          to: [3, 3, 3, 3, 3, 3],
        },
      },
      {
        id: 3,
        name: '杆塔3',
        position: [50, 8, 30],
        fiber: {
          from: [2, 2, 2, 2, 2, 2],
          to: [],
        },
      },
    ]
    loadGltfModel(this.scene, Tower, towers)
  }
  private loadSmallSite() {
    loadGltfModel(this.scene, SmallSite)
  }
  private loadPlatformNew() {
    loadGltfModel(this.scene, MountainsAndRivers)
  }
  private loadPlatform() {
    const width = 300
    const height = 200
    const texture = this.textureLoader.load(planeBg)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.magFilter = THREE.NearestFilter
    const repeatsWidth = width / 2
    const repeatsHeight = height / 2
    texture.repeat.set(repeatsWidth, repeatsHeight)
    const planeGeometry = new THREE.PlaneBufferGeometry(width, height)
    const planeMaterial = new THREE.MeshPhongMaterial({
      map: texture,
      side: THREE.DoubleSide,
    })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.rotation.x = -Math.PI / 2
    this.scene.add(plane)
  }
  event() {
    makeEvent(this.canvas, 'mousemove', this.mousemoveFn.bind(this))
  }
  private mousemoveFn(event: { clientX: number; clientY: number }) {
    const mouse = this.mouse
    let raycaster = this.raycaster
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    raycaster.setFromCamera(mouse, this.camera)
    const intersects = raycaster.intersectObjects(this.scene.children)
    const intersect = intersects[0] // 只取第一个,第一个靠的最近
    if (
      // 当且只有为塔杆和电缆时才会触发
      intersect?.object.name === 'Fiber'
    ) {
      if (this.INTERSECTED) {
        this.INTERSECTED.material.color.set(this.INTERSECTED.currentColor)
      }
      this.INTERSECTED = intersect.object
      this.INTERSECTED.currentColor = this.INTERSECTED.material.color
      this.INTERSECTED.material.color = new THREE.Color(0xff0000)
    }
    if (intersect?.object.name.startsWith('Tower')) {
      if (this.INTERSECTED) {
        this.INTERSECTED.material.color.set(this.INTERSECTED.currentColor)
      }
      // 塔杆暂时不加颜色
      this.INTERSECTED = intersect.object
    }
  }
  render() {
    requestAnimationFrame(this.render.bind(this))
    if (resizeRendererToDisplaySize(this.renderer)) {
      const canvas = this.renderer.domElement
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight
      this.camera.updateProjectionMatrix()
    }
    this.control.update()
    this.renderer.render(this.scene, this.camera)
  }
  dispose() {
    this.renderer.dispose()
    this.scene.children = []
  }
}
