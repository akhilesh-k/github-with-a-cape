;(function () {
  'use strict'

  var configuration = {}

  var urlObserver = new window.MutationObserver(function(mutations, observer) {
    setTimeout(main)
  })

  urlObserver.observe(document.getElementById('js-pjax-loader-bar'), {
    attributes: true,
    attributeFilter: ['class']
  })

  function main() {
    if (configuration.SHOW_OUTDATED_COMMENTS) {
      shoutOutdatedDiffs()
    }

    if (configuration.SHOW_CURRENT_FILE_NAME) {
      showCurrentFileName()
    }

    if (configuration.COLLAPSABLE_DIFFS) {
      collapsableDiffs()
    }

    if (configuration.SHOW_ALL_HIDE_ALL_BUTTONS) {
      showHideAllButtons()
    }

    if (configuration.COLLAPSABLE_COMMITS) {
      collapseCommits()
    }
  }

  chrome.storage.sync.get({
    SHOW_OUTDATED_COMMENTS   : true,
    SHOW_CURRENT_FILE_NAME   : true,
    COLLAPSABLE_DIFFS        : true,
    SHOW_ALL_HIDE_ALL_BUTTONS: true,
    COLLAPSABLE_COMMITS      : true
  }, function (items) {
    configuration = items
    main()
  })

  chrome.storage.onChanged.addListener(function(changes, namespace) {
    // This could be nicer and re-bind all events after each update
    for(var prop in changes) {
      configuration[prop] = changes[prop].newValue
    }
  })

  // -----------------------------------------------------------------------------
  // Features

  function shoutOutdatedDiffs() {
    var outdatedDiffs = document.getElementsByClassName('outdated-diff-comment-container')

    for(var i = 0; i < outdatedDiffs.length; i++) {
      outdatedDiffs[i].classList.add('open')
    }
  }


  function showCurrentFileName() {
    var prtoolbar = document.querySelector('.pr-toolbar.js-sticky')
    if (! prtoolbar) return

    var diffbar = prtoolbar.querySelector('.diffbar')
    var headers = document.getElementsByClassName('file-header')
    var blobs   = document.getElementsByClassName('blob-wrapper')

    var diffbarItem = document.getElementById('__ghcape-current-file')
    if (! diffbarItem) {
      diffbarItem = createDiffItem()
      diffbar.insertBefore(diffbarItem, diffbar.querySelector('.float-right'))
    }

    document.addEventListener('scroll', onScroll, false)

    onScroll()

    function onScroll() {
      var index = firstIndexInViewport(blobs)
      var currentHeader = headers[index]

      diffbarItem.style.display = prtoolbar.style.position === 'fixed' ? 'block' : 'none'

      if (currentHeader) {
        diffbarItem.innerHTML = currentHeader.dataset.path
      }
    }

    function createDiffItem() {
      var diffbarItem = document.createElement('div')
      diffbarItem.id = '__ghcape-current-file'
      diffbarItem.className = 'diffbar-item'

      diffbarItem.style.width        = "240px"
      diffbarItem.style.marginRight  = "0"
      diffbarItem.style.whiteSpace   = "nowrap"
      diffbarItem.style.textOverflow = "ellipsis"
      diffbarItem.style.overflow     = "hidden"

      return diffbarItem
    }
  }


  function collapsableDiffs() {
    makeCollapsable({
      trigger: 'file-header',
      toggleableSibling: 'blob-wrapper'
    })
  }


  function showHideAllButtons() {
    var actions = document.querySelector('.pr-toolbar.js-sticky .float-right')

    if (actions && actions.getElementsByClassName('__ghcape-show-hide-all').length === 0) {
      var headers = Array.prototype.slice.call(document.getElementsByClassName('file-header'))

      var showAll = document.createElement('button')
      showAll.innerHTML = 'Show all'
      showAll.className = 'diffbar-item btn-link muted-link __ghcape-show-hide-all'
      showAll.onclick = function () { changeHadersVisibillity('remove') }

      var hideAll = document.createElement('button')
      hideAll.innerHTML = 'Hide all'
      hideAll.className = 'diffbar-item btn-link muted-link __ghcape-show-hide-all'
      hideAll.onclick = function () { changeHadersVisibillity('add') } // This will potentially break the filename on the sticky header

      actions.appendChild(showAll)
      actions.appendChild(hideAll)
    }

    function changeHadersVisibillity(method) {
      headers.forEach(function (header) {
        var code = nextByClass(header, 'blob-wrapper')
        if (code) code.classList[method]('hidden')
      })
    }
  }

  
  function collapseCommits() {
    makeCollapsable({
      trigger: 'commit-group-title',
      toggleableSibling: 'commit-group'
    })
  }

  // -----------------------------------------------------------------------------
  // Utils

  function makeCollapsable(classes) {
    var triggers = document.getElementsByClassName(classes.trigger)

    for(var i = 0; i < triggers.length; i++) {
      triggers[i].addEventListener('click', togglePanel)
      triggers[i].style.cursor = 'pointer'
    }

    function togglePanel(event) {
      if (! event.target.classList.contains(classes.trigger)) return

      var code = nextByClass(this, classes.toggleableSibling)
      if (code) {
        code.classList.toggle('hidden')
      }
    }
  }

  function prevByClass(node, className) {
    return findSibling(node, 'previous', className)
  }

  function nextByClass(node, className) {
    return findSibling(node, 'next', className)
  }

  function findSibling(node, direction, className) {
    while (node = node[direction + 'Sibling']) {
      if (node.classList && node.classList.contains(className)) {
        return node
      }
    }
  }

  function firstIndexInViewport(els) {
    for(let i = 0; i < els.length; i++) {
      if (inViewport(els[i])) {
        return i
      }
    }
  }

  function inViewport(el) {
    let rect = el.getBoundingClientRect()
    let windowHeight = window.innerHeight || document.documentElement.clientHeight
    return rect.height && rect.top <= windowHeight && (rect.top + rect.height) >= 0
  }
})()
