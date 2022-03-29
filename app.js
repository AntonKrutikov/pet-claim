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
            const item = document.createElement('div')
            item.classList.add('pet-select-item')

            const radio = document.createElement('input')
            radio.classList.add('pet-select-item__radio')
            radio.type = 'radio'
            radio.name = 'pet'
            radio.value = pet.name

            const avatar = document.createElement('div')
            avatar.classList.add('pet-select-item__avatar')

            const name = document.createElement('div')
            name.classList.add('pet-select-item__name')
            name.innerText = pet.name

            item.appendChild(radio)
            item.appendChild(avatar)
            item.appendChild(name)
            this.radioList.appendChild(item)

            item.addEventListener('click', e => {
                radio.checked = true
                this.radioList.querySelectorAll('.pet-select-item').forEach(i => i.classList.remove('selected'))
                item.classList.add('selected')
                this.continue.disabled = false
                this.dispatchEvent(new CustomEvent('petchange', {detail: pet}))
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
            const item = document.createElement('div')
            item.classList.add('treat-item')
            item.innerText = treat
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

                this.dispatchEvent(new CustomEvent('treatschange', {detail: this.selected}))
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
        this.treatList = this.querySelector('.treat-select')
        this.continue = this.querySelector('.button-continue')
        this.continue.addEventListener('click', e => {
            if (!e.target.disabled) {
                this.dispatchEvent(new CustomEvent('continue'))
            }
        })

        this.skip = this.querySelector('.button-skip')
        this.skip.addEventListener('click', e => {
                this.dispatchEvent(new CustomEvent('continue'))
        })

        this.placeholderUp = this.querySelector('.placeholder-up')

        this.textarea = this.querySelector('textarea')
        this.textarea.addEventListener('input', e => {
            if (e.target.value.length > 0) {
                this.placeholderUp.style.display = 'block'
                this.continue.disabled = false
            } else {
                this.placeholderUp.style.display = 'none'
                this.continue.disabled = true

            }
            this.dispatchEvent(new CustomEvent('detailschange', {detail: e.target.value}))
            //grow
            const offset = this.textarea.offsetHeight - this.textarea.clientHeight;
            this.textarea.style.height = `${this.textarea.scrollHeight + offset}px`
        })
    }
}
customElements.define('page-details', PageDetails)

class PageUploadInvoice extends HTMLElement {
    constructor() {
        super()
        this._files = []

        this.innerHTML = `
        <section class="attachments">
            <header class="page-header">Upload the invoice from your vet visit</header>
            <div class="page-info">
                The more information we have, the faster we can process the claim.
                <br>
                Upload multiple files if needed.
            </div>
            <div class="files"></div>
            <input type="file" accept="image/*" style="display: none">
            <button class="button-continue">Upload</button>
            <button class="button-skip">I Don't Have One</button>
        </section>
        <image-cropper></image-cropper>
        `
        this.classList.add('page-content')
        this.fileInput = this.querySelector('input[type=file]')
        this.uploadButton = this.querySelector('.button-continue')
        this.uploadButton.addEventListener('click', e => {
            this.fileInput.click()
        })

        this.imageCropper = this.querySelector('image-cropper')

        this.imageCropper.addEventListener('cancel', e => {
            this.imageCropper.reset()
            this.showInfo()
        })

        this.imageCropper.addEventListener('select', async e => {
            const img = document.createElement('img')
            const data = await this.imageCropper.croppie.result({type: 'base64', size: 'original'})
            this._files.push(data)
            img.src = data
            this.querySelector('.files').appendChild(img)
            this.hideCropper()
            this.showInfo()
        })

        this.fileInput.addEventListener('change', e => {
            const reader = new FileReader()
            reader.onload = e => {
                this.imageCropper.picture = e.target.result
                this.showCropper()
                this.hideInfo()
            }
            if (this.fileInput.files && this.fileInput.files.length > 0) {
                reader.readAsDataURL(this.fileInput.files[0])
            }
            this.fileInput.files = null
        })

        this.skip = this.querySelector('.button-skip')
        this.skip.addEventListener('click', e => {
                this.dispatchEvent(new CustomEvent('continue'))
        })
    }

    upateInfo() {
        const header = this.querySelector('header')
        const info = this.querySelector('.page-info')
        if (this._files.length === 0) {
            header.innerHTML = `Upload the invoice from your vet visit`
            info.innerHTML = `
            The more information we have, the faster we can process the claim.
            <br>
            Upload multiple files if needed.
            `
        } else {
            header.innerHTML = `How's the invoice looking?`
            info.innerHTML = `Add another photo, if needed.`
        }
    }

    showInfo() {
        this.upateInfo()
        this.querySelector('.attachments').style.display = 'flex'
    }

    hideInfo() {
        this.querySelector('.attachments').style.display = 'none'
    }

    showCropper() {
        this.imageCropper.show()
    }

    hideCropper() {
        this.imageCropper.hide()
    }
}
customElements.define('page-upload-invoice', PageUploadInvoice)

class ImageCropper extends HTMLElement {
    constructor() {
        super()
        this.reset()
    }

    reset() {
        this.innerHTML = `
        <div class="image-cropper__wrapper">
            <img>
        </div>
        <div class="image-cropper__nav">
            <button class="button-cancel">Cancel</button>
            <button class="button-continue">Continue</button>
        </div>
        `
        this.img = this.querySelector('img')
        this.style.display = 'none'

        this.querySelector('.button-cancel').addEventListener('click', e => {
            this.dispatchEvent(new CustomEvent('cancel'))
        })

        this.querySelector('.button-continue').addEventListener('click', e => {
            this.dispatchEvent(new CustomEvent('select'))
        })
    }

    set picture(img) {
        this.reset()
        this.img.src = img
        this.croppie = new Croppie(this.img, {
            viewport: { width: 200, height: 250 },
            enableOrientation: true,
        })
        setTimeout(() => this.croppie.setZoom(0), 100)
    }

    show() {
        this.style.display = 'flex'
    }

    hide() {
        this.style.display = 'none'
    }
}
customElements.define('image-cropper', ImageCropper)

class PetApp extends HTMLElement {
    constructor() {
        super()
        this.innerHTML = `
        <header>
            <div class="nav-back"></div>
            <div class="avatar"></div>
            <div class="progress">
                <div class="progress-filler"></div>
            </div>
        </header>
        <section></section>
        `
        this.content = this.querySelector('section')
        this.navBack = this.querySelector('.nav-back')

        this.state = {
            petName: null,
            selectedTreats: [],
            treatDetails: null
        }

        this.pages = {
            pet: new PagePet(),
            treats: new PageTreats(),
            details: new PageDetails(),
            uploadInvoice: new PageUploadInvoice()
        }

        this.routes = {
            '': this.pages.pet,
            '#threats': this.pages.treats,
            '#details': this.pages.details,
            '#upload-invoice': this.pages.uploadInvoice
        }

        this.currentRoute = ''

        // Pet select
        this.pages.pet.addEventListener('petchange', e => {
            this.state.petName = e.detail.name
            this.pages.treats.petName = e.detail.name
        })
        this.pages.pet.addEventListener('continue', e => {
            window.location.hash = '#threats'
        })
        // Treat select
        this.pages.treats.addEventListener('treatschange', e => {
            this.state.selectedTreats = e.detail
        })
        this.pages.treats.addEventListener('continue', e => {
            window.location.hash = '#details'
        })
        // Treat details
        this.pages.details.addEventListener('detailschange', e => {
            this.state.treatDetails = e.detail
        })
        this.pages.details.addEventListener('continue', e => {
            window.location.hash = '#upload-invoice'
        })


        this.navBack.addEventListener('click', e => {
            const routeNames = Object.keys(this.routes)
            const index = routeNames.indexOf(this.currentRoute)
            if (index > 0) {
                window.location.hash = routeNames[index - 1]
            }
        })

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
            }
        })
    }

    async init() {
        this.pages.pet.petList = await this.getPets()
        this.pages.treats.treats = await this.getTreats()
        this.content.replaceChildren(this.pages.pet)
    }
    
    async getPets() {
        //TODO: load pets from API
        const petList = [
            {name: 'Coco'},
            {name: 'Lucky'}
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
}

customElements.define('pet-app', PetApp)


window.addEventListener('load', e => {
    window.location.hash = ''
})