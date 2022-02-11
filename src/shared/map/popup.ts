/*
 * @Author: Li Jian
 * @Date: 2022-02-11 14:35:24
 * @LastEditTime: 2022-02-11 15:07:11
 * @LastEditors: Li Jian
 * @Description: 弹出提示框
 */
import tippy, { Instance, Props, roundArrow } from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/dist/svg-arrow.css'
import 'tippy.js/animations/shift-away-extreme.css'
import 'tippy.js/themes/translucent.css'

export let popInstance: Instance<Props>

export default function (
  event: { path: { style: { cursor: string } }[]; clientX: any; clientY: any },
  popElem: HTMLDivElement,
  data: any
) {
  if (popInstance) popInstance.hide()
  if (popElem.children.length) {
    Array.from(popElem.children).map(elem => {
      elem.remove()
    })
  }
  let parDom
  event.path[0].style.cursor = 'pointer'
  parDom = document.createElement('div')
  parDom.style.color = 'white'
  parDom.style.cursor = 'pointer'
  parDom.style.position = 'absolute'
  parDom.style.left = `${event.clientX}px`
  parDom.style.top = `${event.clientY}px`
  popElem.appendChild(parDom)

  popInstance = tippy(parDom, {
    content: `${data.name}：${data.info}`,
    // trigger: 'click',
    animation: 'shift-away-extreme',
    arrow: roundArrow,
    duration: [500, 1000],
    theme: 'translucent',
  })
  popInstance.show()
}
