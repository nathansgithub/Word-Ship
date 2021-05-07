'use strict'

function transition(tagsToTransition = [], cssClass, unset = false) {
    let untransitioned = []
    for (let i = 0; i < tagsToTransition.length; i++) {
        untransitioned = untransitioned.concat(Array.from(document.getElementsByClassName(tagsToTransition[i])))
    }
    for (let i = 0; i < untransitioned.length; i++) {
        if (unset) untransitioned[i].classList.remove(cssClass)
        else untransitioned[i].classList.add(cssClass)
    }
}

transition(['transitioning', 'halo'], 'transitioned', false)

