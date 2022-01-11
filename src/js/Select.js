//Description
// заполнить лист передать в data массив [{name:'Name', id:'100'}]


function getTemplate(option){

    let text = '';
    let id = '';
    
    let list = option.data.map(item => {
        if(item.id == option.selectedId){
            text = item.name;
            id = item.id;
        }
        return `<p data-type="list-item" data-id="${item.id}">${item.name}</p>`;
    });

    return `
        <div data-type="backdrop" class="select-js-backdrop"></div>
        <input value="${text}" data-type="input" type="text" class="${option.inputClass ?? 'table-input'}" placeholder="${option.placeholder ?? ''}" ${option.readonly ? 'readonly' : ''} ${option.required ? 'required' : ''}>
        <input value="${id}"  type="hidden" name="${option.model}">
        <label class="select-js-label">${option.label ?? ''}</label>
        ${option.arrow ? `<div class="select-js-arrow" data-type="arrow"></div>` : ''}
        ${option.clean ? `<div class="select-js-clean" data-type="clean"></div>` : ''}
        <div class="select-js-list" data-type="list">${list.join('')}</div>
    `;
}

export class Select {

    constructor(option){

        this.url = option.url;  // Куда отпраялвется запрос
        this.value = option.value; // Если нужно подставить значение
        this.selector = option.selector; // сcs-селектор родителя(куда вставить инпут)
        this.model = option.model;// Название модели для атрибута name
        this.query = option.query;// по событию input будет срабатывать запрос в экшн (bool)
        this.required = option.required;// обязательное поле (bool)
        this.data = option.data;// если передаем данные из экшена не через запрос, а через html-атрибут 
        this.inputClass = option.inputClass;// класс для инпута
        this.label = option.label;// класс для инпута
        this.placeholder = option.placeholder;//чтобы работал label нужен placeholder
        this.readonly = option.readonly;//(bool)
        this.arrow = option.arrow;//(bool)
        this.clean = option.clean;//(bool)
        this.edit = option.edit;// параметр редактирования
        this.selectedId = option.selectedId; // id выбранного элемента из спика

        this.$wrapper = document.createElement('div');
        this.$wrapper.classList.add('select-js-wrapper');

        this.option = option;

        this.#render(option);
        this.input = this.$wrapper.querySelector('input[type="text"]');
        this.inputHidden = this.$wrapper.querySelector('input[type="hidden"]');
        this.#setup();
       

        //для поиска вводом
        this.list = this.$wrapper.querySelector('[data-type="list"]');

        this.#checkEdit();
    
    }
    
    getWrapper(){
        return this.$wrapper;        
    }

    #render(){
        this.$wrapper.innerHTML = getTemplate(this.option);

        if(this.selector){
            const out = document.querySelector(this.selector);
            out.append(this.$wrapper);
        }
    }

    #setup(){
        this.clickHandler = this.clickHandler.bind(this);
        this.$wrapper.addEventListener('click', this.clickHandler);

        this.inputHandler = this.inputHandler.bind(this);
        
        this.input.addEventListener('input', this.inputHandler);
    }

    clickHandler(event){
        const {type} = event.target.dataset;
        
        if(type === 'input' || type === 'arrow'){
            this.toggle();
        }else if(type === 'clean'){
            this.input.value = '';
            this.inputHidden.value = '';
            this.chekErrorClass();
            this.refreshSelected();
        }else if(type === 'list-item'){
            this.select(event.target.dataset.id);
        }else if(type === 'backdrop'){
            this.toggle();
        }
    }

    inputHandler(event){
        
        let value = event.target.value;

        let search = this.option.data.filter(el => el.name.includes(value));

        this.list.innerHTML = getItems(search);

        function getItems(array){
            let result = array.map(item=> {
                return `<p data-type="list-item" data-id="${item.id}">${item.name}</p>`;
            });
            return result.join('');
        }

        if(value === ''){
            this.list.innerHTML = getItems(this.option.data);
        }
    }

    select(id){
        this.selectedId = id;
        this.input.value = this.current.name;
        this.inputHidden.value = this.current.id;

        this.refreshSelected();
        this.$wrapper.querySelector(`p[data-id="${id}"]`).classList.add('selected');
        this.close();
    }

    refreshSelected(){
        this.$wrapper.querySelectorAll(`[data-type="list-item"]`).forEach(item => item.classList.remove('selected'));
    }

    get current(){
        return this.option.data.find(item => item.id == this.selectedId);
    }

    get isOpen(){
        return this.$wrapper.classList.contains('_open-select-js-list');
    }

    get isError(){
        return this.$wrapper.classList.contains('has-error');
    }

    toggle(){
        this.isOpen ? this.close() : this.open();
    }

    chekErrorClass(){
        this.isError ? this.$wrapper.classList.remove('has-error') : this.$wrapper.classList.add('has-error');
    }

    pasteHandler(event){

    }

    open(){
        this.$wrapper.classList.add('_open-select-js-list');
    }

    close(){
        this.$wrapper.classList.remove('_open-select-js-list');
    }

    #checkEdit(){
        if(this.edit != undefined){
            if(!this.edit){
                this.$wrapper.classList.add('_no-edit');
            }
        }
    }

    destroy(){
        this.$wrapper.removeEventListener('click', this.clickHander);
        this.$wrapper.parentElement.innerHTML = '';

        this.input.removeEventListener('input', this.inputHandler);
    }
}