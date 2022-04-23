const createElement = (tag, classList, content, attributes) => {
    const element = document.createElement(tag)
    if (classList) classList.forEach(c => element.classList.add(c))
    if (content) element.innerHTML = content
    if (attributes)
        for (const [name, value] of Object.entries(attributes)) {
            element[name] = value
        }
    element.show = () => element.style.display = null
    element.hide = () => element.style.display = 'none'
    return element
}

class PagePet extends HTMLElement {
    constructor() {
        super()
        this.innerHTML = `
        <header class="page-header">Which pet is this claim for?</header>
        <div class="pet-select page-main-content"></div>
        <button class="button-continue" disabled>Continue</button>
        `
        this.classList.add('page-content')
        this.radioList = this.querySelector('.pet-select')

        this.continue = this.querySelector('.button-continue')
        this.continue.addEventListener('click', e => {
            if (!e.target.disabled) {
                this.dispatchEvent(new CustomEvent('continue'))
            }
        })
    }

    set petList(list) {
        this.radioList.replaceChildren()
        for (const pet of list) {
            const item = createElement('div', ['pet-select-item'])
            const radio = createElement('input', ['pet-select-item__radio'], null, { type: 'radio', name: 'pet', value: pet.name })
            const avatar = createElement('div', ['pet-select-item__avatar'])
            const name = createElement('div', ['pet-select-item__name'], pet.name)

            if (pet.avatar) avatar.style.backgroundImage = `url(${pet.avatar})`

            item.appendChild(radio)
            item.appendChild(avatar)
            item.appendChild(name)
            this.radioList.appendChild(item)

            item.addEventListener('click', e => {
                radio.checked = true
                this.radioList.querySelectorAll('.pet-select-item').forEach(i => i.classList.remove('selected'))
                item.classList.add('selected')
                this.continue.disabled = false
                this.dispatchEvent(new CustomEvent('petchange', { detail: pet }))
            })
        }
    }
}
customElements.define('page-pet', PagePet)

class PageTreats extends HTMLElement {
    constructor() {
        super()
        this.innerHTML = `
        <header class="page-header">What was treated for?</header>
        <div class="treat-select page-main-content"></div>
        <button class="button-continue" disabled>Continue</button>
        `
        this.classList.add('page-content')
        this.treatList = this.querySelector('.treat-select')
        this.continue = this.querySelector('.button-continue')
        this.continue.addEventListener('click', e => {
            if (!e.target.disabled) {
                this.dispatchEvent(new CustomEvent('continue'))
            }
        })

        this.selected = []
    }

    set petName(name) {
        this.querySelector('header').innerText = `What was ${name} treated for?`
    }

    set treats(list) {
        for (const treat of list) {
            const item = createElement('div', ['treat-item'], treat)
            this.treatList.appendChild(item)

            item.addEventListener('click', e => {
                if (!item.classList.contains('selected')) {
                    this.selected.push(treat)
                    item.classList.add('selected')
                } else {
                    this.selected = this.selected.filter(i => i !== treat)
                    item.classList.remove('selected')
                }

                if (this.selected.length > 0) {
                    this.continue.disabled = false
                } else {
                    this.continue.disabled = true
                }

                this.dispatchEvent(new CustomEvent('treatschange', { detail: this.selected }))
            })
        }
    }
}
customElements.define('page-treats', PageTreats)

class PageDetails extends HTMLElement {
    constructor() {
        super()
        this.innerHTML = `
        <header class="page-header">Any additional details you'd like to provide?</header>
        <div class="treat-details">
            <span class="placeholder-up">Provide details</span>
            <textarea placeholder="Provide details"></textarea>
        </div>
        <button class="button-continue" disabled>Continue</button>
        <button class="button-skip">Skip</button>
        `
        this.classList.add('page-content')

        this.textarea = this.querySelector('textarea')
        this.placeholderUp = this.querySelector('.placeholder-up')
        this.continueButton = this.querySelector('.button-continue')
        this.skipButton = this.querySelector('.button-skip')

        this.textarea.addEventListener('input', e => {
            this.updateViewState()
            this.dispatchEvent(new CustomEvent('detailschange', { detail: this.textarea.value }))
            //grow
            const offset = this.textarea.offsetHeight - this.textarea.clientHeight;
            this.textarea.style.height = `${this.textarea.scrollHeight + offset}px`
        })

        this.continueButton.addEventListener('click', e => {
            if (!e.target.disabled) {
                this.dispatchEvent(new CustomEvent('continue'))
            }
        })

        this.skipButton.addEventListener('click', e => {
            this.textarea.value = ''
            this.updateViewState()
            this.dispatchEvent(new CustomEvent('detailschange', { detail: this.textarea.value }))
            this.dispatchEvent(new CustomEvent('continue'))
        })
    }

    updateViewState() {
        if (this.textarea.value.length > 0) {
            this.placeholderUp.style.display = 'block'
            this.continueButton.disabled = false
        } else {
            this.placeholderUp.style.display = 'none'
            this.continueButton.disabled = true
        }
    }
}
customElements.define('page-details', PageDetails)

class PageInvoice extends HTMLElement {
    constructor() {
        super()
        this.photos = []
        this.imageExtension = ['png', 'jpg', 'jpeg', 'tiff', 'tif', 'svg']
        this.supportedFileExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'tiff', 'tif', 'svg', 'eml', 'oft', 'msg', 'docx']
        this.fileIcons = {
            'pdf': '/assets/pdf.png',
            'eml': '/assets/eml.png',
            'oft': '/assetes/document.png',
            'msg': '/assets/document.png',
            'html': '/assets/html.png',
            'docx': '/assets/docx.png'
        }
        this.maxFileUploadSize = 25 * 1024 * 1024

        this.text = {
            header: {
                emptyState: `Upload the invoice from your vet visit`,
                photoState: `How's the invoice looking?`
            },
            subHeader: {
                emptyState: `The more information we have, the faster we can process the claim. <br> Upload multiple files if needed. <br> max file size 25Mb`,
                photoState: `Add another file, if needed.`
            }
        }

        this.header = createElement('header', ['page-header'], this.text.header.emptyState)
        this.subHeader = createElement('header', ['page-subheader'], this.text.subHeader.emptyState)
        this.error = createElement('div', ['error'])
        this.error.innerHTML = `
        <div class="error-icon">i</div>
        <div class="error-wrapper">
            <div class="error-title"></div>
            <div class="error-rows-wrapper"></div>
        </div>
        `
        this.error.style.display = 'none'
        this.previewContainer = createElement('div', ['preview-container'])
        this.fileInput = createElement('input', [], null, { type: 'file', accept: this.supportedFileExtensions.map(e => `.${e}`).join(','), multiple: true })
        this.uploadButton = createElement('button', ['button-continue'], `Upload`)
        this.skipButton = createElement('button', ['button-skip'], `I Don't Have One`)
        this.usePhotoButton = createElement('button', ['button-continue'], `Use This Files`)
        this.uploadAnotherButton = createElement('button', ['button-continue', 'invert'], `Upload Another`)
        this.tryAgainButton = createElement('button', ['button-skip'], `Try Again`)
        this.imageCropper = new ImageCropper()

        this.usePhotoButton.hide()
        this.uploadAnotherButton.hide()
        this.tryAgainButton.hide()

        this.previewState = {
            all: [this.header, this.subHeader, this.previewContainer, this.fileInput, this.uploadButton, this.skipButton, this.usePhotoButton, this.uploadAnotherButton, this.tryAgainButton, this.imageCropper],
            empty: [this.header, this.subHeader, this.previewContainer, this.fileInput, this.uploadButton, this.skipButton],
            photos: [this.header, this.subHeader, this.previewContainer, this.fileInput, this.usePhotoButton, this.uploadAnotherButton, this.tryAgainButton],
            cropper: [this.imageCropper]
        }
        this.currentPreviewState = 'empty'

        this.append(this.header, this.subHeader, this.error, this.previewContainer, this.fileInput, this.uploadButton, this.skipButton, this.imageCropper, this.usePhotoButton, this.uploadAnotherButton, this.tryAgainButton)
        this.classList.add('page-content')

        // Trigger file select
        this.uploadButton.addEventListener('click', e => {
            this.fileInput.click()
        })
        this.uploadAnotherButton.addEventListener('click', e => {
            this.fileInput.click()
        })

        // Call cropper for each new file
        this.tasks = []
        this.fileInput.addEventListener('change', async e => {
            // Hide error block
            let tooBigFiles = []
            this.error.querySelector('.error-rows-wrapper').replaceChildren()
            this.error.style.display = 'none'
            // Create task for file in upload
            for (const file of this.fileInput.files) {
                if (file.size >= this.maxFileUploadSize) {
                    tooBigFiles.push(file)
                    continue
                }
                //skip unsoported types by extension
                const ext = file.name.split('.').slice(-1)[0]
                if (!this.supportedFileExtensions.includes(ext)) continue

                const task = () => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader()
                        reader.onload = e => {
                            resolve({ file: e.target.result, name: file.name })
                        }
                        reader.readAsDataURL(file)
                    })
                }
                this.tasks.push(task)
            }

            // Show error for exceeded files
            if (tooBigFiles.length > 0) {
                this.error.querySelector('.error-title').innerText = 'Some files exceeds max upload size:'
                for (const f of tooBigFiles) {
                    let row = document.createElement('div')
                    row.classList.add('error-row')
                    row.innerHTML = `
                        <span class="error-filename">${f.name}</span>&nbsp;
                        <span>${(f.size / 1024 /1024).toFixed(0)} MB</span>
                    `
                    this.error.querySelector('.error-rows-wrapper').appendChild(row)
                }
                this.error.style.display = null
            }

            // Execute crop tasks 1 by 1 only for images
            // For other files just add
            for (const task of this.tasks) {
                const { file, name } = await task()
                const ext = name.split('.').slice(-1)[0]

                if (this.imageExtension.includes(ext)) {
                    const cropperTask = async () => {
                        return new Promise((resolve, reject) => {
                            this.imageCropper.setPhoto(file, resolve)
                            this.updatePreviewState('cropper')
                        })
                    }
                    const result = await cropperTask()
                    if (result) {
                        const preview = this.createPreview(result)
                        this.previewContainer.appendChild(preview)
                        this.photos.push(result)
                        this.dispatchEvent(new CustomEvent('photoschange', { detail: this.photos }))
                    }
                } else {
                    const preview = this.createPreview(file, this.fileIcons[ext], name)
                    this.previewContainer.appendChild(preview)
                    this.photos.push(file)
                    this.dispatchEvent(new CustomEvent('photoschange', { detail: this.photos }))
                }
            }
            this.fileInput.value = null
            this.tasks = []
            this.updatePreviewState( this.photos.length > 0 ? 'photos' : 'empty')
        })

        // Buttons events
        this.skipButton.addEventListener('click', e => {
            this.dispatchEvent(new CustomEvent('continue'))
            this.error.style.display = 'none'
        })
        this.usePhotoButton.addEventListener('click', e => {
            this.dispatchEvent(new CustomEvent('continue'))
            this.error.style.display = 'none'
        })
        this.tryAgainButton.addEventListener('click', e => {
            this.photos = []
            this.dispatchEvent(new CustomEvent('photoschange', { detail: this.photos }))
            this.previewContainer.replaceChildren()
            this.updatePreviewState('empty')
            this.error.style.display = 'none'
        })
    }

    updatePreviewState(state) {
        this.currentPreviewState = state
        if (state === 'photos') {
            this.header.innerHTML = this.text.header.photoState
            this.subHeader.innerHTML = this.text.subHeader.photoState
        } else {
            this.header.innerHTML = this.text.header.emptyState
            this.subHeader.innerHTML = this.text.subHeader.emptyState
        }
        this.previewState.all.forEach(el => el.hide())
        this.previewState[state].forEach(el => el.show())
    }

    createPreview(data, ico, text) {
        const wrapper = createElement('div', ['preview__photo-wrpapper'])
        const img = createElement('img')
        const removeButton = createElement('div', ['preview__remove'], '+')
        img.src = ico ?? data
        wrapper.appendChild(img)
        wrapper.appendChild(removeButton)
        if (text) {
            const name = createElement('div', ['preview__text'], text)
            wrapper.append(name)
        }

        removeButton.addEventListener('click', e => {
            wrapper.remove()
            this.photos = this.photos.filter(p => p !== data)
            this.updatePreviewState(this.photos.length > 0 ? 'photos' : 'empty')
            this.dispatchEvent(new CustomEvent('photoschange', { detail: this.photos }))
        })
        return wrapper
    }
}
customElements.define('page-invoice', PageInvoice)

class ImageCropper extends HTMLElement {
    constructor() {
        super()
        this.innerHTML = `
        <div class="croppie-wrapper"></div>
        <div class="buttons-wrapper">
            <button class="button-cancel">Cancel</button>
            <button class="button-skip">Skip cropping</button>
            <button class="button-continue">Continue</button>
        </div>
        `
        this.wrapper = this.querySelector('.croppie-wrapper')
        this.cancelButton = this.querySelector('.button-cancel')
        this.skipButton = this.querySelector('.button-skip')
        this.continueButton = this.querySelector('.button-continue')

        this.croppie = new Croppie(this.wrapper, {
            viewport: { width: 200, height: 250 },
            enableOrientation: true,
        })

        this.cancelButton.addEventListener('click', e => {
            if (this.resolve) this.resolve(null)
        })

        this.skipButton.addEventListener('click', e => {
            if (this.resolve) this.resolve(this.originalImg)
        })

        this.continueButton.addEventListener('click', e => {
            if (this.resolve) this.resolve(this.croppie.result({ type: 'base64', size: 'original' }))
        })

        this.hide()
    }

    setPhoto(img, resolve) {
        this.originalImg = img
        this.resolve = resolve
        this.croppie.bind({
            url: img,
            zoom: 0
        })
    }

    getResultBase64() {
        return this.croppie.result({ type: 'base64', size: 'original' })
    }

    show() {
        this.style.display = null
    }

    hide() {
        this.style.display = 'none'
    }
}
customElements.define('image-cropper', ImageCropper)

class PageConfirm extends HTMLElement {
    constructor() {
        super()
        this.innerHTML = `
        <header class="page-header">Does this claim look correct?</header>
        <section class="wrapper">
            <div class="confirm-item pet-info">
                <div class="avatar"></div>
                <div class="title-text">WHO'S IT FOR?</div>
                <div class="data-text"></div>
            </div>
            <div class="confirm-item treat-info">
                <div class="avatar"></div>
                <div class="title-text">FOR WHAT REASON?</div>
                <div class="data-text"></div>
                <div class="arrow-right"></div>
            </div>
            <div class="confirm-item invoice-info">
                <div class="avatar"></div>
                <div class="title-text">INVOICE</div>
                <div class="data-text"></div>
                <div class="arrow-right"></div>
            </div>
        </section>
        <div class="submit-notice">By submitting a claim, you're agreeing to allow Trupanion to access your pet's medical records</div>
        <button class="button-continue">Submit Claim</button>
        <button class="button-skip">Cancel</button>
        `
        this.classList.add('page-content')

        this.treatDetailButton = this.querySelector('.treat-info .arrow-right')
        this.invoiceButton = this.querySelector('.invoice-info .arrow-right')
        this.continueButton = this.querySelector('.button-continue')
        this.cancelButton = this.querySelector('.button-skip')

        this.treatDetailButton.addEventListener('click', e => this.dispatchEvent(new CustomEvent('treatdetailedit')))
        this.invoiceButton.addEventListener('click', e => this.dispatchEvent(new CustomEvent('invoiceedit')))
        this.continueButton.addEventListener('click', e => this.dispatchEvent(new CustomEvent('submit')))
        this.cancelButton.addEventListener('click', e => this.dispatchEvent(new CustomEvent('cancel')))
    }

    set petInfo(data) {
        this.querySelector('.pet-info .data-text').textContent = data.name
        this.querySelector('.pet-info .avatar').style.backgroundImage = `url(${data.avatar})`
    }

    set treatDetail(text) {
        this.querySelector('.treat-info .data-text').textContent = text
    }

    set invoicePhotosCount(count) {
        const text = count === 1 ? `1 image attached` : `${count} images attached`
        this.querySelector('.invoice-info .data-text').innerText = text
    }
}
customElements.define('page-confirm', PageConfirm)

class PageSubmitResult extends HTMLElement {
    constructor() {
        super()
        this.innerHTML = `
        <header class="page-header">Your claim was submitted!</header>
        <header class="page-subheader"></header>
        <header class="page-header">What's next?</header>
        <ul>
            <li>We'll alert you via email at <b>emaloney@chewy.com</b> if we need more information from you.</li>
            <li>Most claims take 1 week to reach an outcome.</li>
            <li>Add routing information to get your payout deposited within 1-2 days of outcome versus 4-6 weeks with a mailed check.</li>
        </ul>
        <button class="button-continue">Add routing information</button>
        <button class="button-skip">No, Thanks</button>
        `
        this.classList.add('page-content')
    }

    set petName(name) {
        this.querySelector('.page-subheader').innerText = `And we're glad ${name} was treated.`
    }
}
customElements.define('page-submit-result', PageSubmitResult)

class PetApp extends HTMLElement {
    constructor() {
        super()
        this.innerHTML = `
        <header>
            <div class="nav-back"></div>
            <div class="avatar"></div>
            <div class="progress">
                <div class="progress-bar"></div>
            </div>
        </header>
        <section></section>
        `
        this.header = this.querySelector('header')
        this.content = this.querySelector('section')
        this.avatar = this.querySelector('.avatar')
        this.backButton = this.querySelector('.nav-back')
        this.progressBar = this.querySelector('.progress-bar')

        this.state = {
            petName: null,
            selectedTreats: [],
            treatDetails: null,
            invoicePhotos: []
        }

        this.pages = {
            pet: new PagePet(),
            treats: new PageTreats(),
            details: new PageDetails(),
            uploadInvoice: new PageInvoice(),
            confirm: new PageConfirm(),
            submitted: new PageSubmitResult()
        }

        this.routes = {
            '': this.pages.pet,
            '#treatments': this.pages.treats,
            '#details': this.pages.details,
            '#invoice': this.pages.uploadInvoice,
            '#confirm': this.pages.confirm,
            '#submitted': this.pages.submitted
        }

        this.currentRoute = ''
        this.backButton.addEventListener('click', e => this.goBack())

        // Pet select
        this.pages.pet.addEventListener('petchange', e => {
            this.state.petName = e.detail.name
            this.pages.treats.petName = e.detail.name
            this.pages.confirm.petInfo = e.detail
            this.pages.submitted.petName = e.detail.name

            this.avatar.style.backgroundImage = `url(${e.detail.avatar})`
        })
        this.pages.pet.addEventListener('continue', e => window.location.hash = '#treatments')
        // Treat select
        this.pages.treats.addEventListener('treatschange', e => this.state.selectedTreats = e.detail)
        this.pages.treats.addEventListener('continue', e => window.location.hash = '#details')
        // Treat details
        this.pages.details.addEventListener('detailschange', e => {
            this.state.treatDetails = e.detail
            this.pages.confirm.treatDetail = e.detail
        })
        this.pages.details.addEventListener('continue', e => window.location.hash = '#invoice')
        // Invoice
        this.pages.uploadInvoice.addEventListener('photoschange', e => {
            this.state.invoicePhotos = e.detail
            this.pages.confirm.invoicePhotosCount = e.detail.length
        })
        this.pages.uploadInvoice.addEventListener('continue', e => {
            window.location.hash = '#confirm'
        })
        // Confirm
        this.pages.confirm.addEventListener('treatdetailedit', e => window.location.hash = '#details')
        this.pages.confirm.addEventListener('invoiceedit', e => window.location.hash = '#invoice')
        this.pages.confirm.addEventListener('cancel', e => window.location.hash = '')
        this.pages.confirm.addEventListener('submit', e => this.submit())


        this.routerInit()
        this.init()
    }

    routerInit() {
        window.addEventListener('hashchange', e => {
            const route = window.location.hash
            const page = this.routes[route]
            if (page) {
                this.content.replaceChildren(page)
                this.currentRoute = route

                const keys = Object.keys(this.routes)
                const index = keys.indexOf(route)
                this.updateProgress(index / (keys.length - 1) * 100)

                this.backButton.style.display = route === '#submitted' ? 'none' : null
            }
        })
    }

    goBack() {
        const routeNames = Object.keys(this.routes)
        const index = routeNames.indexOf(this.currentRoute)
        if (index > 0) {
            window.location.hash = routeNames[index - 1]
        }
    }

    navigateTo(route) {
        window.location.hash = route
    }

    updateProgress(percent) {
        this.progressBar.style.width = `${percent}%`
    }

    async init() {
        this.pages.pet.petList = await this.getPets()
        this.pages.treats.treats = await this.getTreats()
        this.navigateTo('#')
        this.content.replaceChildren(this.pages.pet)
    }

    async getPets() {
        //TODO: load pets from API
        const petList = [
            { name: 'Coco', avatar: '/assets/dog1.jpeg' },
            { name: 'Lucky', avatar: '/assets/dog2.webp' }
        ]
        return petList
    }

    async getTreats() {
        //TODO: load treats from API
        const treatList = [
            'Allergies',
            'Diarrhea',
            'Diabetes',
            'Hot Spots',
            'Injury',
            'Lethargy',
            'Not Eating',
            'Not Drinking',
            'Trouble Walking',
            'Vomitting',
            'Other'
        ]
        return treatList
    }

    async submit() {
        //TODO: submit json to server or create form instance and submit
        console.log(this.state)
        const loader = createElement('lottie-player', ['tail-wagging-dog'], null, {
            src: 'img/blueball.json',
            background: 'transparent',
            speed: 1,
            loop: true,
            autoplay: true
        })

        // Hide header (back, progress) and replace content
        this.header.style.display = 'none'
        this.content.replaceChildren(loader)

        setTimeout(() => {
            this.header.style.display = null //return header back and navigate to state after
            window.location.hash = '#submitted'
        }, 2000)
    }
}

customElements.define('pet-app', PetApp)

// const app = document.querySelector('pet-app')
// setTimeout(() => app.navigateTo('#invoice'), 10)