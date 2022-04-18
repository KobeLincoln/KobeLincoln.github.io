//
const gif_frame_rate = 2;
const gif_frame_count = 21;
const skull_dim = 24;
const GIF_REF_DIM = 1000;
const PREVIEW_DIM = 500;

////////////////////////////////////////////////////////////////////////////////////////////////////

const special_tokens = [9, 19, 20, 24, 27, 36, 41, 42, 43, 70];

////////////////////////////////////////////////////////////////////////////////////////////////////

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// https://stackoverflow.com/a/52127218
const partial = (func, ...args) => (...rest) => func(...args, ...rest);

// ELEMENT CREATION HELPERS ////////////////////////////////////////////////////////////////////////

function myTextInput(placeholder_text, input_parent, input_position) {
    let input = createInput();
    input.parent(input_parent);
    input.attribute('placeholder', placeholder_text);
    input.position(input_position[0], input_position[1]);
    return input;
}

function myImageFileInput(input_parent, input_position) {
    let input = createFileInput(handleImageFileInput, false);
    input.parent(input_parent);
    input.position(input_position[0], input_position[1]);
    console.log(input)
    return input;
}

var input_img_obj = null;
function handleImageFileInput(file) {
    if (input_img_obj != null) {
        input_img_obj.remove();
    }
    if (file.type === 'image') {
        input_img_obj = createImg(file.data, '');
        input_img_obj.id('fileInput')
        input_img_obj.hide();
    }
}

function myButton(display_text, button_parent, button_position, button_function, button_dimensions=[0,0]) {
    let button = createButton(display_text);
    button.parent(button_parent);
    button.position(button_position[0], button_position[1]);
    if (button_dimensions[0] > 0) {
        button.style('width', button_dimensions[0] + 'px');
    }
    if (button_dimensions[1] > 0) {
        button.style('height', button_dimensions[1] + 'px');
    }
    button.mousePressed(button_function);
    return button;
}

function myElement(display_text, element_parent, element_position, html_tag) {
    let element = createElement(html_tag, display_text);
    element.parent(element_parent);
    element.position(element_position[0], element_position[1]);
    element.hide();
    return element;
}

function show_error(error_text) {
    msg_tip.hide();
    msg_error.html(error_text);
    msg_error.show();
}

// IMAGE MANIPULATION HELPERS //////////////////////////////////////////////////////////////////////

function myImage(img, use_dim) {
    let scaled_width = max(1, use_dim);
    let scaled_height = max(1, use_dim);
    if (img.width != scaled_width || img.height != scaled_height) {
        let img_scaled = img.get();
        img_scaled.resize(scaled_width, scaled_height);
        image(img_scaled, 0, 0);
    } else {
        image(img, 0, 0);
    }
}

function get_skull_image(skull_number) {
    let i_cs = skull_dim * (skull_number % 100)
    let j_cs = skull_dim * floor(skull_number / 100)
    let img_skull = createImage(skull_dim, skull_dim)
    img_skull.copy(img_cryptoskulls, i_cs, j_cs, skull_dim, skull_dim, 0, 0, skull_dim, skull_dim)
    return img_skull
}

function get_pixel_color(img, x, y) {
    img.loadPixels()
    index = (x + y * img.width) * 4;
    return color(img.pixels[index], img.pixels[index + 1], img.pixels[index + 2])
}

function bw_replace(img, color_black, color_white) {
    // assumes input images is only made up of black and white pixels
    let w = img.width;
    let h = img.height;
    let img_out = createImage(w, h);
    img.loadPixels();
    img_out.loadPixels();
    let offset, index, color_replace;
    for (let j=0; j<h; j++) {
        offset = j * w;
        for (let i=0; i<w; i++) {
            index = (i + offset) * 4;
                // checking red channel only
            if (img.pixels[index] == 0) {
                color_replace = color_white;
            } else {
                color_replace = color_black;
            }
            for (let k=0; k<4; k++) {
                img_out.pixels[index + k] = color_replace.levels[k];
            }
        }
    }
    img_out.updatePixels();
    return img_out;
}

function colors_match(color1, color2) {
    for (let k = 0; k < 4; k++) {
        if (color1.levels[k] != color2.levels[k]) {
            return false;
        }
    }
    return true;
}

function get_expand_width_textsize(graphic, str, max_width) {
    for (let s = 2; s < 1000; s += 2) {
        graphic.textSize(s);
        graphic.textLeading(s / 2);
        if (graphic.textWidth(str) > max_width) {
            return s - 2;
        }
    }
}

// TOOL STATES /////////////////////////////////////////////////////////////////////////////////////

const N_TOOLS = 7;

const WELCOME_GENERATOR_TAB = 0;
const HEADER_GENERATION_TAB = 1;
const SIDE_PIC_GENERATION_TAB = 2;
const VECTOR_GENERATION_TAB = 3;
const BUNNY_GENERATION_TAB = 4;
const FLESH_GENERATION_TAB = 5;
const HOOD_GENERATION_TAB = 6;

const tool_nav_btn_text = [
    'WELCOME<br>GENERATOR',
    'SKULL<br>CREATOR',
    'SKULL<br>SIDE PIC',
    'SCALABLE<br>PRINT VECTORS',
    'SKULL<br>EASTER BUNNY',
    'SKULL<br>FLESH TOOL',
    'SKULL<br>HOOD TOOL',
];

html_link = (url, text) => {return '<a href="' + url + '" target="_blank">' + text + '</a>'};
twitter_link = (handle) => {return html_link('https://twitter.com/' + handle, '@' + handle)};
credit = (title, link) => {return '<br>' + title + '<br>' + link + '<br>'};
const tool_credits = [
    credit('art', twitter_link('mdilone')) + credit('tool', twitter_link('KobeDLincoln')),
    credit('art', twitter_link('mdilone')) + credit('tool', twitter_link('KobeDLincoln')),
    credit('credit', twitter_link('KobeDLincoln')),
    credit('credit', twitter_link('KobeDLincoln')),
    credit('art', twitter_link('Sbreyen')) + credit('tool', twitter_link('KobeDLincoln')),
    credit('art', twitter_link('jbray808')) + credit('tool', twitter_link('KobeDLincoln'))
    + credit('AI', html_link('https://justadudewhohacks.github.io/face-api.js/docs/index.html', 'face-api.js')),
    credit('art', twitter_link('HeMaxiOk')) + credit('tool', twitter_link('KobeDLincoln')),
];

const tool_tip_msg_text = [
    '',
    '',
    '',
    '',
    '',
    'TO IMPROVE RESULTS'
        + '<br>- TYPICAL "PASSPORT PHOTO" GUIDELINES'
        + '<br>- DIRECT FACE SHOT AT A STRAIGHT ANGLE'
        + '<br>- SOLID (PREFERABLY WHITE) BACKGROUND',
    '',
];

const tool_processing_msg_text = [
    'SKULLIFYING A WELCOME...',
    'RETRIEVING IMAGES...',
    'RETRIEVING IMAGE...',
    'RETRIEVING VECTORS...',
    'EASTER BUNNIFYING SKULL...',
    'FLESHIFYING SKULL...',
    'HOODING SKULL... ',
];

const tool_preview_msg_text = [
    'NOTE: GIF DOWNLOAD MAY TAKE ABOUT<br>20 SECONDS TO COMPLETE.',
    'PREVIEW IN 500x500. ACTUAL IMAGES<br>ARE 1500x500, 1000x1000 and 1000x1000.',
    'PREVIEW IN 240x240.<br>ACTUAL IMAGE IN 336x336.',
    'REGULAR AND TRANSPARENT BACKGROUND<br>VECTORS AVAILABLE FOR DOWNLOAD.',
    'PREVIEW IN 240x240.<br>ACTUAL IMAGE IN 336x336.',
    'PREVIEW AND DOWNLOAD IN 480x480.',
    'PREVIEW IN 240x240.<br>ACTUAL IMAGE IN 336x336.',
];

const tool_dl_btn_text = [
    'DOWNLOAD GIF',
    'DOWNLOAD IMAGES',
    'DOWNLOAD IMAGE',
    'DOWNLOAD VECTORS',
    'DOWNLOAD PNG & SVG',
    'DOWNLOAD IMAGE',
    'DOWNLOAD IMAGE',
];

// MAIN P5 FUNCTIONS ///////////////////////////////////////////////////////////////////////////////

var p5_canvas;

preload = function() {
    img_cryptoskulls = loadImage('./img/cryptoskulls.png')
    img_sn1 = loadImage('./img/skullnation1.png')
    img_sn2 = loadImage('./img/skullnation2.png')
    img_sn3 = loadImage('./img/skullnation3.png')
    img_flesh_alpha = loadImage('./img/flesh_tool_alpha.png')
    font_cs = loadFont('./font/cryptoskulls.otf')
    faceapi.loadSsdMobilenetv1Model('/models');
    faceapi.loadFaceLandmarkModel('/models');
}

setup = function() {

    // divs
    div_navigation = 'sideNavigation';
    div_preview = 'canvasForHTML';
    div_capture = 'canvasForGif';

    // navigation buttons
    let nav_btn_dims = [210, 60];
    nav_buttons = [];
    for (let i=0; i<N_TOOLS; i++) {
        let pos_y = 40 + 70 * i;
        nav_buttons.push(myButton(tool_nav_btn_text[i], div_navigation, [0, pos_y], partial(run_restart, i), nav_btn_dims));
    }

    // inputs
    input_number = myTextInput('ENTER SKULL #', div_preview, [15, 100]);
    input_handle = myTextInput('TWITTER @HANDLE', div_preview, [15, 175]);
    input_longname = myTextInput('TWITTER LONG NAME', div_preview, [15, 250]);
    input_upload_prompt = myElement('UPLOAD HEADSHOT', div_preview, [15, 200], 'h4');
    input_upload_file = myImageFileInput(div_preview, [15, 240]);
    
    // tool buttons
    let tool_btn_dims = [240, 60];
    button_generate = myButton('GENERATE', div_preview, [15, 350], run_generate, tool_btn_dims);
    button_restart = myButton('RESTART', div_preview, [275, 600], run_restart, tool_btn_dims);
    button_download = myButton('--DOWNLOAD--', div_preview, [15, 600], run_download, tool_btn_dims);

    // tool messages
    let msg_pos = [15, 425];
    msg_tip = myElement('--TIP--', div_preview, msg_pos, 'h2');
    msg_error = myElement('--ERROR--', div_preview, msg_pos, 'h3');
    msg_processing = myElement('--PROCESSING--', div_preview, msg_pos, 'h2');
    msg_preview = myElement('--PREVIEW--', div_preview, [15, 525], 'h2');

    // groups
    input_elements = [input_number, input_handle, input_longname, input_upload_prompt, input_upload_file, msg_tip, button_generate];
    message_elements = [msg_error, msg_processing, msg_preview];

    // canvas
    p5_canvas = createCanvas(PREVIEW_DIM, PREVIEW_DIM);

    // initialization
    tool_state = WELCOME_GENERATOR_TAB;
    run_restart(tool_state);
}

var tool_generation;
var captured_frames;
var capturer;

draw = function() {

    // state changes
    if (!is_looping_state && isLooping()) {
        base_frame_count = frameCount;
        is_looping_state = true;
    } else if (is_looping_state && !isLooping()) {
        is_looping_state = false;
        is_preview_state = false;
    }

    if (is_preview_state && p5_canvas.parent().id != div_preview) {
        console.log('showing preview');
        msg_processing.hide();
        button_download.show();
        msg_preview.show();
        resizeCanvas(PREVIEW_DIM, PREVIEW_DIM);
        p5_canvas.parent(div_preview);
        frameRate(gif_frame_rate);
    }

    if (tool_state == WELCOME_GENERATOR_TAB) {

        if (frameCount - base_frame_count == 0) {
            is_capture_state = true;
            console.log('starting capture');
            captured_frames = 0;
            capturer = new CCapture({
                framerate: gif_frame_rate,
                format: "gif",
                workersPath: "./",
                name: "CS_welcome_" + tool_generation.skull_number,
                verbose: false,
            });
            capturer.start();
        }

        if (isLooping()) {
            clear();
            frame_index = (frameCount - base_frame_count) % gif_frame_count;
            let use_dim = is_preview_state ? PREVIEW_DIM : GIF_REF_DIM;
            myImage(tool_generation.images[frame_index], use_dim);
        } else {
            draw_tool_splash();
        }

        if (is_capture_state) {
            capturer.capture(p5_canvas.canvas);
            captured_frames += 1;
        }

        if (is_capture_state && captured_frames >= gif_frame_count) {
            console.log('ending capture');
            is_capture_state = false;
            capturer.stop();
            is_preview_state = true;
        }

    } else {
        if (isLooping()) {
            clear();
            if (tool_generation.preview_produced) {
                myImage(tool_generation.preview_image, PREVIEW_DIM);
            } else {
                tool_generation.update();
                if (tool_generation.preview_produced) {
                    is_preview_state = true;
                }
            }
        } else {
            draw_tool_splash();
        }
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////

function draw_tool_splash() {

    background(0);

    input_number.value('');
    input_handle.value('');
    input_longname.value('');
    input_upload_file.value('');

    msg_tip.html(tool_tip_msg_text[tool_state]);
    msg_processing.html(tool_processing_msg_text[tool_state]);
    msg_preview.html(tool_preview_msg_text[tool_state]);
    button_download.html(tool_dl_btn_text[tool_state]);

    for (let inp_el of input_elements) {inp_el.hide()};
    for (let msg_el of message_elements) {msg_el.hide()};

    input_number.show();
    if (tool_state == WELCOME_GENERATOR_TAB) {
        input_handle.show();
        input_longname.show();
    }
    if (tool_state == FLESH_GENERATION_TAB) {
        input_upload_prompt.show();
        input_upload_file.show();
    }

    msg_tip.show();
    button_generate.show();

    button_download.hide();
    button_restart.hide();

    document.getElementById('tool_title').innerHTML = tool_nav_btn_text[tool_state] + '<br>' + tool_credits[tool_state];
}

////////////////////////////////////////////////////////////////////////////////////////////////////

function run_restart(new_tool_state=undefined) {
    noLoop();
    if (new_tool_state != undefined) {
        tool_state = new_tool_state;
    }
    is_looping_state = false;
    is_preview_state = false;
    is_capture_state = false;
    base_frame_count = 0;
    p5_canvas.parent(div_capture);
    if (tool_state == WELCOME_GENERATOR_TAB) {
        resizeCanvas(GIF_REF_DIM, GIF_REF_DIM);
    } else {
        resizeCanvas(PREVIEW_DIM, PREVIEW_DIM);
    }
}

// CHECK INPUTS AND GENERATE ///////////////////////////////////////////////////////////////////////

ERR_NUMBER = 'INVALID SKULL NUMBER!';
ERR_LORD = 'NO LORDS! ONLY PEASANT SKULLS!';
ERR_HANDLE = 'INVALID TWITTER HANDLE!';
ERR_LONGNAME = 'INVALID TWITTER LONG NAME!';
ERR_IMAGE = 'NO IMAGE FILE SELECTED<br>OR INVALID FILE TYPE!';
ERR_NOFACE = 'COULD NOT DETECT FACE IN UPLOADED IMAGE!<br>PLEASE RESTART.';

function run_generate() {
    // skull number
    let skull_number = parseInt(input_number.value());
    if (input_number.value() == '' || skull_number == undefined || skull_number < 1 || skull_number > 10000 || isNaN(skull_number)) {
        show_error(ERR_NUMBER);
        return;
    }
    if (special_tokens.indexOf(skull_number) !== -1) {
        show_error(ERR_LORD);
        return;
    }
    let args = [skull_number];
    // twitter info
    if (tool_state == WELCOME_GENERATOR_TAB) {
        let twitter_handle = input_handle.value();
        let twitter_longname = input_longname.value();
        if (twitter_handle == undefined || twitter_handle == '') {
            show_error(ERR_HANDLE);
            return;
        }
        if (twitter_longname == undefined || twitter_longname == '') {
            show_error(ERR_LONGNAME);
            return;
        }
        args.push(twitter_handle);
        args.push(twitter_longname);
    }
    // image file
    if (tool_state == FLESH_GENERATION_TAB) {
        if (input_img_obj == null) {
            show_error(ERR_IMAGE);
            return;
        }
    }
    // hide inputs and error messages, show processing and restart
    for (let inp_el of input_elements) {inp_el.hide()};
    for (let msg_el of message_elements) {msg_el.hide()};
    button_restart.show();
    msg_processing.show();

    // handle canvas resizing


    tool_generation = new generation_classes[tool_state](...args);
    loop();
}

// INDIVIDUAL TOOL GENERATION LOGIC ////////////////////////////////////////////////////////////////

// WELCOME GIF /////////////////////////////////////////////////////////////////////////////////////

class WelcomeGeneration {
    constructor(skull_number, twitter_handle, twitter_longname) {
        this.skull_number = skull_number;
        this.twitter_handle = twitter_handle;
        this.twitter_longname = twitter_longname;
        this.expansions = [19, 34, 60, 106, 187];

        console.log('generating welcome', this.skull_number, this.twitter_handle, this.twitter_longname);

        this.img_skull = get_skull_image(this.skull_number);
        let color_outline = color(38, 50, 56)
        this.color_bg = get_pixel_color(this.img_skull, 0, 0);
        this.color_skull = get_pixel_color(this.img_skull, 11, 19);
        let color_bones = get_pixel_color(this.img_skull, 4, 20);
        let color_hair = get_pixel_color(this.img_skull, 11, 3);
        if (colors_match(color_hair, this.color_skull) || colors_match(color_hair, color_outline)) {
            color_hair = get_pixel_color(this.img_skull, 4, 3);
        }
        let color_eyes = get_pixel_color(this.img_skull, 9, 10);

        let color_accent;
        if (!colors_match(color_bones, this.color_bg)) {
            color_accent = color_bones;
        } else if (!colors_match(color_hair, this.color_bg)) {
            color_accent = color_hair;
        } else if (!colors_match(color_eyes, this.color_skull)) {
            color_accent = color_eyes;
        } else {
            color_accent = color_outline;
            console.log('Setting accent color to outline color!')
        }
        // console.log(this.color_bg, this.color_skull, color_accent)
        this.img_16 = bw_replace(img_sn2, color_accent, this.color_skull)
        this.img_17 = bw_replace(img_sn3, color_accent, this.color_skull)
        this.img_18 = bw_replace(img_sn3, this.color_skull, color_accent)
        this.img_19 = bw_replace(img_sn2, this.color_skull, color_accent)
        this.img_20 = this.img_16
        this.img_21 = bw_replace(img_sn2, this.color_skull, this.color_bg)

        this.images = [];
        let temp_image;
        for (let i = 0; i < gif_frame_count; i++) {
            this.images.push(this.generate_frame(i))
        }
    }

    generate_frame(frame_index) {
        let graphic = createGraphics(GIF_REF_DIM, GIF_REF_DIM);
        graphic.textAlign(CENTER, CENTER);
        graphic.textFont(font_cs);

        if (frame_index <= 10) {
            graphic.background(this.color_bg);
            graphic.fill(this.color_skull);
        } else if (frame_index <= 14) {
            graphic.background(this.color_skull);
            graphic.textSize(GIF_REF_DIM / 3);
            graphic.textLeading(GIF_REF_DIM / 6);
            graphic.fill(this.color_bg);
        } else {
            // graphic.clear();
        }
        let s;
        switch (true) {
            case frame_index <= 1:
                s = get_expand_width_textsize(graphic, 'CRYPTO', GIF_REF_DIM * 0.95);
                graphic.textSize(s);
                graphic.textLeading(s / 2);
                graphic.text('CRYPTO\nSKULL', GIF_REF_DIM / 2, GIF_REF_DIM / 2);
                break;
            case frame_index <= 3:
                let str = '#' + this.skull_number;
                s = get_expand_width_textsize(graphic, str, GIF_REF_DIM * 0.95);
                graphic.textSize(s);
                graphic.text(str, GIF_REF_DIM / 2, GIF_REF_DIM / 2);
                break;
            case frame_index <= 8:
                let img_resized = this.img_skull.get();
                img_resized.resizeNN(skull_dim * this.expansions[frame_index - 4], 0);
                let x = (GIF_REF_DIM - img_resized.width) / 2;
                let y = (GIF_REF_DIM - img_resized.height) / 2;
                graphic.image(img_resized, x, y);
                break;
            case frame_index <= 10:
                s = min(get_expand_width_textsize(graphic, this.twitter_handle, GIF_REF_DIM * 0.95),
                        get_expand_width_textsize(graphic, this.twitter_longname, GIF_REF_DIM * 0.95));
                graphic.textSize(s);
                graphic.textLeading(s / 2);
                graphic.text(this.twitter_handle + '\n' + this.twitter_longname, GIF_REF_DIM / 2, GIF_REF_DIM / 2);
                break;
            case frame_index <= 12:
                graphic.text('WELCOME', GIF_REF_DIM / 2, GIF_REF_DIM / 2);
                break;
            case frame_index <= 14:
                graphic.text('TO', GIF_REF_DIM / 2, GIF_REF_DIM / 2);
                break;
            case frame_index <= 15:
                graphic.image(this.img_16, 0, 0);
                break;
            case frame_index <= 16:
                graphic.image(this.img_17, 0, 0);
                break;
            case frame_index <= 17:
                graphic.image(this.img_18, 0, 0);
                break;
            case frame_index <= 18:
                graphic.image(this.img_19, 0, 0);
                break;
            case frame_index <= 19:
                graphic.image(this.img_20, 0, 0);
                break;
            case frame_index <= 20:
                graphic.image(this.img_21, 0, 0);
                break;
        }
        return graphic;
    }
}

// HEADER //////////////////////////////////////////////////////////////////////////////////////////

class HeaderGeneration {
    constructor(skull_number) {
        this.skull_number = skull_number;
        this.loaded_header = false;
        this.loaded_square_a = false;
        this.loaded_square_b = false;
        this.preview_produced = false;
        this.preview_image = createGraphics(PREVIEW_DIM, PREVIEW_DIM);
        console.log('generating header', this.skull_number);
        let img_base_url = 'https://raw.githubusercontent.com/KobeLincoln/cryptoskull_stuff/main/exports/';
        this.img_header = loadImage(img_base_url + 'CS_Twitter_Header/' + this.skull_number + '.png', () => {this.loaded_header = true;});
        this.img_square_a = loadImage(img_base_url + 'CS_1x1A/' + this.skull_number + '.png', () => {this.loaded_square_a = true;});
        this.img_square_b = loadImage(img_base_url + 'CS_1x1B/' + this.skull_number + '.png', () => {this.loaded_square_b = true;});
    }
    update() {
        if (this.loaded_header && this.loaded_square_a && this.loaded_square_b && !this.preview_produced) {
            console.log('generating preview image')
            let img_header_scaled = this.img_header.get();
            let img_square_a_scaled = this.img_square_a.get();
            let img_square_b_scaled = this.img_square_b.get();

            let half_dim = floor(PREVIEW_DIM / 2) - 1;
            let third_dim = floor(PREVIEW_DIM / 3);

            img_header_scaled.resize(PREVIEW_DIM, third_dim);
            img_square_a_scaled.resize(half_dim, half_dim);
            img_square_b_scaled.resize(half_dim, half_dim);

            this.preview_image.image(img_header_scaled, 0, 0);
            this.preview_image.image(img_square_a_scaled, 0, third_dim + 2);
            this.preview_image.image(img_square_b_scaled, half_dim + 2, third_dim + 2);

            this.preview_image.textAlign(CENTER, CENTER);
            this.preview_image.textFont(font_cs);
            this.preview_image.fill('#c20e1a');
            this.preview_image.textSize(150);
            this.preview_image.translate(PREVIEW_DIM/2, PREVIEW_DIM/3);
            this.preview_image.rotate(-QUARTER_PI/2);
            this.preview_image.text('PREVIEW', 0, 0);

            this.preview_produced = true;
        }
    }
}

// SIDE PIC ////////////////////////////////////////////////////////////////////////////////////////

class SidePicGeneration {
    constructor(skull_number) {
        this.skull_number = skull_number;
        this.loaded_side_pic = false;
        this.loaded_og_pic = false;
        this.preview_produced = false;
        this.preview_image = createGraphics(PREVIEW_DIM, PREVIEW_DIM);
        console.log('generating side pic', this.skull_number);
        let img_base_url = 'https://raw.githubusercontent.com/KobeLincoln/cryptoskull_stuff/main/exports/';
        this.img_og_pic = loadImage(img_base_url + 'cryptoskulls_24/' + this.skull_number + '.png', () => {this.loaded_og_pic = true;});
        this.img_side_pic = loadImage(img_base_url + 'cryptoskulls_24_profile/' + this.skull_number + '.png', () => {this.loaded_side_pic = true;});
    }
    update() {
        if (this.loaded_side_pic && this.loaded_og_pic && !this.preview_produced) {
            console.log('generating preview image');

            this.img_side_pic_dl = this.img_side_pic.get();
            this.img_side_pic_dl.resizeNN(skull_dim * 14);

            let img_og_pic_scaled = this.img_og_pic.get();
            img_og_pic_scaled.resizeNN(skull_dim * 10);

            let img_side_pic_scaled = this.img_side_pic.get();
            img_side_pic_scaled.resizeNN(skull_dim * 10);

            this.preview_image.image(img_side_pic_scaled, 260, 0);
            this.preview_image.image(img_og_pic_scaled, 0, 0);

            this.preview_produced = true;
        }
    }
}

// VECTOR //////////////////////////////////////////////////////////////////////////////////////////

class VectorGeneration {
    constructor(skull_number) {
        this.skull_number = skull_number;
        this.loaded_og_pic = false;
        this.preview_produced = false;
        this.preview_image = createGraphics(PREVIEW_DIM, PREVIEW_DIM);
        console.log('generating vector', this.skull_number);
        let img_base_url = 'https://raw.githubusercontent.com/KobeLincoln/cryptoskull_stuff/main/exports/';
        this.img_og_pic = loadImage(img_base_url + 'cryptoskulls_24/' + this.skull_number + '.png', () => {this.loaded_og_pic = true;});
        this.url_svg_o = 'img/exports/svg/' + this.skull_number + '.svg';
        this.url_svg_t = 'img/exports/svg_t/' + this.skull_number + '.svg';
    }
    update() {
        if (this.loaded_og_pic && !this.preview_produced) {
            console.log('generating preview image');
            let img_og_pic_scaled = this.img_og_pic.get();
            img_og_pic_scaled.resizeNN(skull_dim * 20);
            this.preview_image.image(img_og_pic_scaled, 0, 0);
            this.preview_produced = true;
        }
    }
}

// BUNNY ///////////////////////////////////////////////////////////////////////////////////////////

class BunnyGeneration {
    constructor(skull_number) {
        this.skull_number = skull_number;
        this.loaded_bunny = false;
        this.loaded_og_pic = false;
        this.preview_produced = false;
        this.preview_image = createGraphics(PREVIEW_DIM, PREVIEW_DIM);
        console.log('generating bunny pic', this.skull_number);
        let img_base_url = 'https://raw.githubusercontent.com/KobeLincoln/cryptoskull_stuff/main/exports/';
        this.img_og_pic = loadImage(img_base_url + 'cryptoskulls_24/' + this.skull_number + '.png', () => {this.loaded_og_pic = true;});
        this.img_bunny = loadImage(img_base_url + 'bunny/' + this.skull_number + '.png', () => {this.loaded_bunny = true;});
        this.url_svg_o = 'img/exports/bunny_svg/' + this.skull_number + '.svg';
    }
    update() {
        if (this.loaded_bunny && this.loaded_og_pic && !this.preview_produced) {
            console.log('generating preview image');

            this.img_bunny_dl = this.img_bunny.get();
            this.img_bunny_dl.resizeNN(skull_dim * 14);

            let img_og_pic_scaled = this.img_og_pic.get();
            img_og_pic_scaled.resizeNN(skull_dim * 10);

            let img_bunny_scaled = this.img_bunny.get();
            img_bunny_scaled.resizeNN(skull_dim * 10);

            this.preview_image.image(img_bunny_scaled, 260, 0);
            this.preview_image.image(img_og_pic_scaled, 0, 0);

            this.preview_produced = true;
        }
    }
}

// FLESH ///////////////////////////////////////////////////////////////////////////////////////////

// https://itnext.io/face-api-js-javascript-api-for-face-recognition-in-the-browser-with-tensorflow-js-bcc2a6c4cf07

class FleshGeneration {
    constructor(skull_number) {
        this.skull_number = skull_number;
        this.img_skull = get_skull_image(this.skull_number);
        this.img_skull_masked = this.img_skull.get();
        this.img_skull_masked.mask(img_flesh_alpha);
        this.preview_produced = false;
        this.preview_image = createGraphics(480, 480);
        console.log('generating flesh skull', this.skull_number);
        this.loaded_face_description = false;
        this.load_face_description();
    }
    async load_face_description() {
        await sleep(1); // 1 ms allows the GUI time to update
        this.face_description = await faceapi.detectSingleFace('fileInput').withFaceLandmarks();
        this.loaded_face_description = true;
    }
    update() {
        if (this.loaded_face_description) {

            if (this.face_description == undefined) {
                console.log('no face');
                msg_processing.hide();
                show_error(ERR_NOFACE);
            }

            console.log('generating preview image');
            let g_temp = createGraphics(input_img_obj.width, input_img_obj.height);
            g_temp.image(input_img_obj, 0, 0)
            let img_flesh_scaled = g_temp.get();
            this.calc_face_transform();
            img_flesh_scaled.resize(this.scale * img_flesh_scaled.width, this.scale * img_flesh_scaled.height)

            let img_skull_scaled = this.img_skull.get();
            img_skull_scaled.resizeNN(skull_dim * 20);

            let img_skull_masked_scaled = this.img_skull_masked.get();
            img_skull_masked_scaled.resizeNN(skull_dim * 20);

            this.preview_image.image(img_skull_scaled, 0, 0);
            this.preview_image.image(img_flesh_scaled, this.position.x, this.position.y);
            this.preview_image.image(img_skull_masked_scaled, 0, 0);

            this.preview_produced = true;
        }
    }
    calc_face_transform() {
        // face
        let landmarks = this.face_description.landmarks;
        let flesh_left_eye = average_point(landmarks.getLeftEye());
        let flesh_right_eye = average_point(landmarks.getRightEye());
        let flesh_nose = average_point(landmarks.getNose());
        let flesh_mouth = average_point(landmarks.getMouth());

        // skull constants
        let mult = 20;
        let skull_left_eye = make_point(9.5 * mult, 10.5 * mult);
        let skull_right_eye = make_point(14.5 * mult, 10.5 * mult);
        let skull_nose = make_point(12 * mult, 14.5 * mult);
        let skull_mouth = make_point(12 * mult, 17.0 * mult);

        // scale
        let x_scale = (skull_right_eye.x - skull_left_eye.x) / (flesh_right_eye.x - flesh_left_eye.x);
        let eye_avg_y = (flesh_right_eye.y + flesh_left_eye.y) / 2;
        let y_scale = (skull_left_eye.y - skull_mouth.y) / (eye_avg_y - flesh_mouth.y);
        // console.log('x and y scales', x_scale, y_scale);
        this.scale = (x_scale + y_scale) / 2;

        // position
        let x_pos = 12 * mult - this.scale * (flesh_left_eye.x + flesh_right_eye.x) / 2;
        let y_pos = (skull_left_eye.y + skull_nose.y + skull_mouth.y)/3 - this.scale * (eye_avg_y + flesh_nose.y + flesh_mouth.y)/3;

        this.position = make_point(x_pos, y_pos);
    }
}

function average_point(point_array) {
    let x_sum = 0;
    let y_sum = 0;
    for (let point of point_array) {
        x_sum += point._x;
        y_sum += point._y;
    }
    return make_point(x_sum / point_array.length, y_sum / point_array.length);
}

function make_point(x, y) {
    return {'x':x, 'y':y};
}

// HOOD ////////////////////////////////////////////////////////////////////////////////////////////

class HoodGeneration {
    constructor(skull_number) {
        this.skull_number = skull_number;
        this.loaded_hood = false;
        this.loaded_og_pic = false;
        this.preview_produced = false;
        this.preview_image = createGraphics(PREVIEW_DIM, PREVIEW_DIM);
        console.log('generating hood', this.skull_number);
        let img_base_url = 'https://raw.githubusercontent.com/KobeLincoln/cryptoskull_stuff/main/exports/';
        this.img_og_pic = loadImage(img_base_url + 'cryptoskulls_24/' + this.skull_number + '.png', () => {this.loaded_og_pic = true;});
        this.img_hood = loadImage(img_base_url + 'hood_336/' + this.skull_number + '.png', () => {this.loaded_hood = true;});
    }
    update() {
        if (this.loaded_hood && this.loaded_og_pic && !this.preview_produced) {
            console.log('generating preview image');

            this.img_hood_dl = this.img_hood.get();
            this.img_hood_dl.resizeNN(skull_dim * 14);

            let img_og_pic_scaled = this.img_og_pic.get();
            img_og_pic_scaled.resizeNN(skull_dim * 10);

            let img_hood_scaled = this.img_hood.get();
            img_hood_scaled.resizeNN(skull_dim * 10);

            this.preview_image.image(img_hood_scaled, 260, 0);
            this.preview_image.image(img_og_pic_scaled, 0, 0);

            this.preview_produced = true;
        }
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////

let generation_classes = [
    WelcomeGeneration,
    HeaderGeneration,
    SidePicGeneration,
    VectorGeneration,
    BunnyGeneration,
    FleshGeneration,
    HoodGeneration,
];

// DOWNLOAD ////////////////////////////////////////////////////////////////////////////////////////

async function run_download() {
    if (tool_state == WELCOME_GENERATOR_TAB) {
        console.log('downloading gif');
        capturer.save();
    } else if (tool_state == HEADER_GENERATION_TAB) {
        console.log('downloading image 1');
        tool_generation.img_header.save('CS_Twitter_Header_' + tool_generation.skull_number, 'png');
        await sleep(1000);
        console.log('downloading image 2');
        tool_generation.img_square_a.save('CS_1x1A_' + tool_generation.skull_number, 'png');
        await sleep(1000);
        console.log('downloading image 3');
        tool_generation.img_square_b.save('CS_1x1B_' + tool_generation.skull_number, 'png');
    } else if (tool_state == SIDE_PIC_GENERATION_TAB) {
        console.log('downloading image');
        tool_generation.img_side_pic_dl.save('CS_side_pic_' + tool_generation.skull_number, 'png');
    } else if (tool_state == VECTOR_GENERATION_TAB) {
        console.log('downloading vectors');
        var anchor_1 = document.createElement('a');
        anchor_1.href = tool_generation.url_svg_o;
        anchor_1.target = '_blank';
        anchor_1.download = 'CS_vector_' + tool_generation.skull_number + '.svg';
        var anchor_2 = document.createElement('a');
        anchor_2.href = tool_generation.url_svg_t;
        anchor_2.target = '_blank';
        anchor_2.download = 'CS_vector_t_' + tool_generation.skull_number + '.svg';
        anchor_1.click();
        await sleep(1000);
        anchor_2.click();
    } else if (tool_state == BUNNY_GENERATION_TAB) {
        console.log('downloading png');
        tool_generation.img_bunny_dl.save('CS_bunny_' + tool_generation.skull_number, 'png');
        var anchor_1 = document.createElement('a');
        anchor_1.href = tool_generation.url_svg_o;
        anchor_1.target = '_blank';
        anchor_1.download = 'CS_bunny_' + tool_generation.skull_number + '.svg';
        await sleep(1000);
        console.log('downloading svg');
        anchor_1.click();
    } else if (tool_state == FLESH_GENERATION_TAB) {
        console.log('downloading image');
        tool_generation.preview_image.get().save('CS_flesh_' + tool_generation.skull_number, 'png');
    } else if (tool_state == HOOD_GENERATION_TAB) {
        console.log('downloading image');
        tool_generation.img_hood_dl.save('CS_hood_' + tool_generation.skull_number, 'png');
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////

// https://gist.github.com/GoToLoop/2e12acf577506fd53267e1d186624d7c

/**
 * Resize the image to a new width and height using nearest neighbor algorithm.
 * To make the image scale proportionally, use 0 as the value for the wide or high parameters.
 * For instance, to make the width of an image 150 pixels,
 * and change the height using the same proportion, use resize(150, 0). 
 * Otherwise same usage as the regular resize().
 * 
 * Note: Disproportionate resizing squashes the "pixels" from squares to rectangles. 
 * This works about 10 times slower than the regular resize.
 * Any suggestions for performance increase are welcome.
 */

// https://GitHub.com/processing/p5.js/issues/1845

p5.Image.prototype.resizeNN = function (w, h) {
  "use strict";

  // Locally cache current image's canvas' dimension properties:
  const {width, height} = this.canvas;

  // Sanitize dimension parameters:
  w = ~~Math.abs(w), h = ~~Math.abs(h);

  // Quit prematurely if both dimensions are equal or parameters are both 0:
  if (w === width && h === height || !(w | h))  return this;

  // Scale dimension parameters:
  w || (w = h*width  / height | 0); // when only parameter w is 0
  h || (h = w*height / width  | 0); // when only parameter h is 0

  const img = new p5.Image(w, h), // creates temporary image
        sx = w / width, sy = h / height; // scaled coords. for current image

  this.loadPixels(), img.loadPixels(); // initializes both 8-bit RGBa pixels[]

  // Create 32-bit viewers for current & temporary 8-bit RGBa pixels[]:
  const pixInt = new Int32Array(this.pixels.buffer),
        imgInt = new Int32Array(img.pixels.buffer);

  // Transfer current to temporary pixels[] by 4 bytes (32-bit) at once:
  for (let y = 0; y < h; ) {
    const curRow = width * ~~(y/sy), tgtRow = w * y++;

    for (let x = 0; x < w; ) {
      const curIdx = curRow + ~~(x/sx), tgtIdx = tgtRow + x++;
      imgInt[tgtIdx] = pixInt[curIdx];
    }
  }

  img.updatePixels(); // updates temporary 8-bit RGBa pixels[] w/ its current state

  // Resize current image to temporary image's dimensions:
  this.canvas.width = this.width = w, this.canvas.height = this.height = h;
  this.drawingContext.drawImage(img.canvas, 0, 0, w, h, 0, 0, w, h);

  return this;
};