//
const gif_frame_rate = 2;
const gif_frame_count = 21;
const skull_dim = 24;
const REF_DIM = 1000;
const PREVIEW_DIM = 500;
var USE_DIM = REF_DIM;

////////////////////////////////////////////////////////////////////////////////////////////////////

const special_tokens = [9, 19, 20, 24, 27, 36, 41, 42, 43, 70];

////////////////////////////////////////////////////////////////////////////////////////////////////

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// https://stackoverflow.com/a/52127218
const partial = (func, ...args) => (...rest) => func(...args, ...rest);

// ELEMENT CREATION HELPERS ////////////////////////////////////////////////////////////////////////

function myInput(placeholder_text, input_parent, input_position) {
    let input = createInput();
    input.parent(input_parent);
    input.attribute('placeholder', placeholder_text);
    input.position(input_position[0], input_position[1]);
    return input;
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
    msg_error.html(error_text);
    msg_error.show();
}

// IMAGE MANIPULATION HELPERS //////////////////////////////////////////////////////////////////////

function myImage(img) {
    let scaled_width = max(1, USE_DIM);
    let scaled_height = max(1, USE_DIM);
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

function expand(img, multiple) {
    let w_o = img.width;
    let w = w_o * multiple;
    let h = img.height * multiple;
    let img_out = createImage(w, h);
    img.loadPixels();
    img_out.loadPixels();
    let img_out_index;
    for (let i = 0; i < w; i++) {
        for (let j = 0; j < h; j++) {
            for (let k = 0; k < 4; k++) {
                img_out_index = (i + j * w) * 4 + k;
                img_index = (floor(i / multiple) + floor(j / multiple) * w_o) * 4 + k;
                img_out.pixels[img_out_index] = img.pixels[img_index];
            }
        }
    }
    img_out.updatePixels();
    return img_out;
}

function bw_replace(img, color_black, color_white) {
    // assumes input images is only made up of black and white pixels
    let img_out = createImage(img.width, img.height);
    img.loadPixels();
    img_out.loadPixels();
    let index, color_replace
    for (let i = 0; i < img.width; i++) {
        for (let j = 0; j < img.height; j++) {
            index = (i + j * img.width) * 4
                // checking red channel only
            if (img.pixels[index] == 0) {
                color_replace = color_white;
            } else {
                color_replace = color_black;
            }
            for (let k = 0; k < 4; k++) {
                img_out.pixels[index + k] = color_replace.levels[k]
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

const N_TOOLS = 5;

const WELCOME_GENERATOR_TAB = 0;
const HEADER_GENERATION_TAB = 1;
const SIDE_PIC_GENERATION_TAB = 2;
const VECTOR_GENERATION_TAB = 3;
const BUNNY_GENERATION_TAB = 4;
const FLESH_GENERATION_TAB = 5;

const tool_nav_btn_text = [
    'WELCOME<br>GENERATOR',
    'SKULL<br>CREATOR',
    'SKULL<br>SIDE PIC',
    'SCALABLE<br>PRINT VECTORS',
    'SKULL<br>EASTER BUNNY',
    'SKULL<br>FLESH TOOL',
];

const tool_credits = [
    '<a href="https://twitter.com/mdilone" target="_blank">@mdilone</a>',
    '<a href="https://twitter.com/mdilone" target="_blank">@mdilone</a>',
    '<a href="https://twitter.com/KobeDLincoln" target="_blank">@KobeDLincoln</a>',
    '<a href="https://twitter.com/KobeDLincoln" target="_blank">@KobeDLincoln</a>',
    '<a href="https://twitter.com/Sbreyen" target="_blank">@Sbreyen</a>',
    '<a href="https://twitter.com/jbray808" target="_blank">@jbray808</a>',
];

const tool_processing_msg_text = [
    'SKULLIFYING A WELCOME...',
    'RETRIEVING IMAGES...',
    'RETRIEVING IMAGE...',
    'RETRIEVING VECTORS...',
    'BUNNIFYING A SKULL...',
    'RETRIEVING SKULL CUTOUT...'
];

const tool_preview_msg_text = [
    'NOTE: GIF DOWNLOAD MAY TAKE ABOUT<br>20 SECONDS TO COMPLETE.',
    'PREVIEW IN 500x500. ACTUAL IMAGES<br>ARE 1500x500, 1000x1000 and 1000x1000.',
    'PREVIEW IN 240x240.<br>ACTUAL IMAGE IN 336x336.',
    'REGULAR AND TRANSPARENT BACKGROUND<br>VECTORS AVAILABLE FOR DOWNLOAD.',
    'PREVIEW IN 240x240.<br>ACTUAL IMAGE IN 336x336.',
    'PREVIEW MESSAGE PLACEHOLDER.',
];

const tool_dl_btn_text = [
    'DOWNLOAD GIF',
    'DOWNLOAD IMAGES',
    'DOWNLOAD IMAGE',
    'DOWNLOAD VECTORS',
    'DOWNLOAD PNG & SVG',
    'DOWNLOAD IMAGE',
];

// MAIN P5 FUNCTIONS ///////////////////////////////////////////////////////////////////////////////

var p5_canvas;

preload = function() {
    img_cryptoskulls = loadImage('./img/cryptoskulls.png')
    img_sn1 = loadImage('./img/skullnation1.png')
    img_sn2 = loadImage('./img/skullnation2.png')
    img_sn3 = loadImage('./img/skullnation3.png')
    font_cs = loadFont('./font/cryptoskulls.otf')
}

setup = function() {

    tool_state = WELCOME_GENERATOR_TAB;

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

    // text inputs
    input_number = myInput('ENTER SKULL #', div_preview, [15, 100]);
    input_handle = myInput('TWITTER @HANDLE', div_preview, [15, 175]);
    input_longname = myInput('TWITTER LONG NAME', div_preview, [15, 250]);

    // tool buttons
    let tool_btn_dims = [240, 60];
    button_generate = myButton('GENERATE', div_preview, [15, 350], run_generate, tool_btn_dims);
    button_restart = myButton('RESTART', div_preview, [275, 600], run_restart, tool_btn_dims);
    button_download = myButton('--DOWNLOAD--', div_preview, [15, 600], run_download, tool_btn_dims);

    // tool messages
    let msg_pos = [15, 425];
    msg_error = myElement('--ERROR--', div_preview, msg_pos, 'h3');
    msg_processing = myElement('--PROCESSING--', div_preview, msg_pos, 'h2');
    msg_preview = myElement('--PREVIEW--', div_preview, [15, 525], 'h2');
    message_elements = [msg_error, msg_processing, msg_preview];

    // canvas
    p5_canvas = createCanvas(REF_DIM, REF_DIM);
    p5_canvas.parent(div_capture);

    frameRate(gif_frame_rate);
    noLoop();
}

var captured_frames;
var capturer;
is_looping_state = false; // for detecting changes in state
is_capture_state = false;
is_preview_state = false;
base_frame_count = 0;

draw = function() {

    // state changes
    if (!is_looping_state && isLooping()) {
        base_frame_count = frameCount;
        is_looping_state = true;

    } else if (is_looping_state && !isLooping()) {
        is_looping_state = false;
        is_preview_state = false;
    }

    if (tool_state == WELCOME_GENERATOR_TAB) {

        if (frameCount - base_frame_count == 0) {
            // TODO can be included in if statement above??
            is_capture_state = true;
            console.log('starting capture');
            captured_frames = 0;
            capturer = new CCapture({
                framerate: gif_frame_rate,
                format: "gif",
                workersPath: "./",
                name: "welcome_" + welcome_generation.skull_number,
                quality: 100,
                verbose: false,
            });
            capturer.start();
        }

        if (is_preview_state && p5_canvas.parent() != div_preview) {
            msg_processing.hide();
            button_download.show();
            msg_preview.show();
            resizeCanvas(PREVIEW_DIM, PREVIEW_DIM);
            p5_canvas.parent(div_preview);
        }

        if (isLooping()) {
            clear();
            frame_index = (frameCount - base_frame_count) % gif_frame_count;
            myImage(welcome_generation.images[frame_index]);
        } else {
            draw_tool_splash();
        }

        if (is_capture_state) {
            capturer.capture(p5_canvas.canvas);
            captured_frames += 1;
        }
        if (is_capture_state && captured_frames >= gif_frame_count) {
            is_capture_state = false;
            capturer.stop();
            USE_DIM = PREVIEW_DIM;
            is_preview_state = true;
        }

    } else if (tool_state == HEADER_GENERATION_TAB) {
        if (is_preview_state && p5_canvas.parent() != div_preview) {
            msg_processing.hide();
            button_download.show();
            msg_preview.show();
            resizeCanvas(PREVIEW_DIM, PREVIEW_DIM);
            p5_canvas.parent(div_preview);
        }
        if (isLooping()) {
            clear();
            if (header_generation.preview_produced) {
                myImage(header_generation.preview_image);
            } else {
                header_generation.update();
                if (header_generation.preview_produced) {
                    USE_DIM = PREVIEW_DIM;
                    is_preview_state = true;
                }
            }
        } else {
            draw_tool_splash();
        }

    } else if (tool_state == SIDE_PIC_GENERATION_TAB) {
        if (is_preview_state && p5_canvas.parent() != div_preview) {
            msg_processing.hide();
            button_download.show();
            msg_preview.show();
            resizeCanvas(PREVIEW_DIM, PREVIEW_DIM);
            p5_canvas.parent(div_preview);
        }
        if (isLooping()) {
            clear();
            if (side_pic_generation.preview_produced) {
                myImage(side_pic_generation.preview_image);
            } else {
                side_pic_generation.update();
                if (side_pic_generation.preview_produced) {
                    USE_DIM = PREVIEW_DIM;
                    is_preview_state = true;
                }
            }
        } else {
            draw_tool_splash();
        }

    } else if (tool_state == VECTOR_GENERATION_TAB) {
        if (is_preview_state && p5_canvas.parent() != div_preview) {
            msg_processing.hide();
            button_download.show();
            msg_preview.show();
            resizeCanvas(PREVIEW_DIM, PREVIEW_DIM);
            p5_canvas.parent(div_preview);
        }
        if (isLooping()) {
            clear();
            if (vector_generation.preview_produced) {
                myImage(vector_generation.preview_image);
            } else {
                vector_generation.update();
                if (vector_generation.preview_produced) {
                    USE_DIM = PREVIEW_DIM;
                    is_preview_state = true;
                }
            }
        } else {
            draw_tool_splash();
        }

    } else if (tool_state == BUNNY_GENERATION_TAB) {
        if (is_preview_state && p5_canvas.parent() != div_preview) {
            msg_processing.hide();
            button_download.show();
            msg_preview.show();
            resizeCanvas(PREVIEW_DIM, PREVIEW_DIM);
            p5_canvas.parent(div_preview);
        }
        if (isLooping()) {
            clear();
            if (bunny_generation.preview_produced) {
                myImage(bunny_generation.preview_image);
            } else {
                bunny_generation.update();
                if (bunny_generation.preview_produced) {
                    USE_DIM = PREVIEW_DIM;
                    is_preview_state = true;
                }
            }
        } else {
            draw_tool_splash();
        }

    } else if (tool_state == FLESH_GENERATION_TAB) {







        draw_tool_splash();




    }

}

////////////////////////////////////////////////////////////////////////////////////////////////////

function draw_tool_splash() {

    background(0);

    input_number.value('');
    input_handle.value('');
    input_longname.value('');

    input_number.show();
    if (tool_state == WELCOME_GENERATOR_TAB) {
        input_handle.show();
        input_longname.show();
    } else {
        input_handle.hide();
        input_longname.hide();
    }

    button_generate.show();

    for (let msg_el of message_elements) {msg_el.hide()};

    msg_processing.html(tool_processing_msg_text[tool_state]);
    msg_preview.html(tool_preview_msg_text[tool_state]);

    button_download.html(tool_dl_btn_text[tool_state]);
    button_download.hide();

    button_restart.hide();

    document.getElementById('tool_title').innerHTML = tool_nav_btn_text[tool_state] + '<br><br>credit<br>' + tool_credits[tool_state];
}

////////////////////////////////////////////////////////////////////////////////////////////////////

function run_restart(new_tool_state=undefined) {
    if (new_tool_state != undefined) {
        tool_state = new_tool_state;
    }
    is_looping_state = false;
    is_preview_state = false;
    is_capture_state = false;
    base_frame_count = 0;
    noLoop();
    USE_DIM = REF_DIM;
    resizeCanvas(REF_DIM, REF_DIM);
    p5_canvas.parent(div_capture);
}

// CHECK INPUTS AND GENERATE ///////////////////////////////////////////////////////////////////////

var welcome_generation;
var skull_number;

ERR_NUMBER = 'INVALID SKULL NUMBER!';
ERR_LORD = 'NO LORDS! ONLY PEASANT SKULLS!';
ERR_HANDLE = 'INVALID TWITTER HANDLE!';
ERR_LONGNAME = 'INVALID TWITTER LONG NAME!';

function run_generate() {

    skull_number = parseInt(input_number.value());
    if (input_number.value() == '' || skull_number == undefined || skull_number < 1 || skull_number > 10000 || isNaN(skull_number)) {
        show_error(ERR_NUMBER);
        return;
    }
    if (special_tokens.indexOf(skull_number) !== -1) {
        show_error(ERR_LORD);
        return;
    }

    if (tool_state == WELCOME_GENERATOR_TAB) {
        twitter_handle = input_handle.value();
        twitter_longname = input_longname.value();
        if (twitter_handle == undefined || twitter_handle == '') {
            show_error(ERR_HANDLE);
            return;
        }
        if (twitter_longname == undefined || twitter_longname == '') {
            show_error(ERR_LONGNAME);
            return;
        }
    }

    input_number.hide();
    input_handle.hide();
    input_longname.hide();

    button_generate.hide();
    for (let msg_el of message_elements) {msg_el.hide()};

    button_restart.show();
    msg_processing.show();

    if (tool_state == WELCOME_GENERATOR_TAB) {
        welcome_generation = new WelcomeGeneration(skull_number, twitter_handle, twitter_longname);
    } else if (tool_state == HEADER_GENERATION_TAB) {
        header_generation = new HeaderGeneration(skull_number);
    } else if (tool_state == SIDE_PIC_GENERATION_TAB) {
        side_pic_generation = new SidePicGeneration(skull_number);
    } else if (tool_state == VECTOR_GENERATION_TAB) {
        vector_generation = new VectorGeneration(skull_number);
    } else if (tool_state == BUNNY_GENERATION_TAB) {
        bunny_generation = new BunnyGeneration(skull_number);
    } else if (tool_state == FLESH_GENERATION_TAB) {


    }
    loop();
}

// INDIVIDUAL TOOL GENERATION LOGIC ////////////////////////////////////////////////////////////////

function WelcomeGeneration(skull_number, twitter_handle, twitter_longname) {
    this.skull_number = skull_number;
    this.twitter_handle = twitter_handle;
    this.twitter_longname = twitter_longname;

    this.produce = function() {

        console.log('generating welcome', this.skull_number, this.twitter_handle, this.twitter_longname);

        this.img_skull = get_skull_image(this.skull_number);
        color_outline = color(38, 50, 56)
        this.color_bg = get_pixel_color(this.img_skull, 0, 0);
        this.color_skull = get_pixel_color(this.img_skull, 11, 19);
        color_bones = get_pixel_color(this.img_skull, 4, 20);
        color_hair = get_pixel_color(this.img_skull, 11, 3);
        if (colors_match(color_hair, this.color_skull) || colors_match(color_hair, color_outline)) {
            color_hair = get_pixel_color(this.img_skull, 4, 3);
        }
        color_eyes = get_pixel_color(this.img_skull, 9, 10);

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

    this.expansions = [19, 30, 45, 109, 187];

    this.generate_frame = function(frame_index) {
        let graphic = createGraphics(REF_DIM, REF_DIM);
        graphic.textAlign(CENTER, CENTER);
        graphic.textFont(font_cs);

        if (frame_index <= 10) {
            graphic.background(this.color_bg);
            graphic.fill(this.color_skull);
        } else if (frame_index <= 14) {
            graphic.background(this.color_skull);
            graphic.textSize(REF_DIM / 3);
            graphic.textLeading(REF_DIM / 6);
            graphic.fill(this.color_bg);
        } else {
            graphic.clear();
        }
        let s, str;
        switch (true) {
            case frame_index <= 1:
                s = get_expand_width_textsize(graphic, 'CRYPTO', REF_DIM * 0.95);
                // console.log('text size', s)
                graphic.textSize(s);
                graphic.textLeading(s / 2);
                graphic.text('CRYPTO\nSKULL', REF_DIM / 2, REF_DIM / 2);
                break;
            case frame_index <= 3:
                str = '#' + this.skull_number;
                s = get_expand_width_textsize(graphic, str, REF_DIM * 0.95);
                // console.log('text size', s)
                graphic.textSize(s);
                graphic.text(str, REF_DIM / 2, REF_DIM / 2);
                break;
            case frame_index <= 8:
                img_resized = expand(this.img_skull, this.expansions[frame_index - 4]);
                x = (REF_DIM - img_resized.width) / 2;
                y = (REF_DIM - img_resized.height) / 2;
                graphic.image(img_resized, x, y);
                break;
            case frame_index <= 10:
                s = min(get_expand_width_textsize(graphic, this.twitter_handle, REF_DIM * 0.95),
                    get_expand_width_textsize(graphic, this.twitter_longname, REF_DIM * 0.95));
                // console.log('text size', s)
                graphic.textSize(s);
                graphic.textLeading(s / 2);
                graphic.text(this.twitter_handle + '\n' + this.twitter_longname, REF_DIM / 2, REF_DIM / 2);
                break;
            case frame_index <= 12:
                graphic.text('WELCOME', REF_DIM / 2, REF_DIM / 2);
                break;
            case frame_index <= 14:
                graphic.text('TO', REF_DIM / 2, REF_DIM / 2);
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

    this.produce()
}

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
        } else {
            // console.log(this.loaded_header, this.loaded_square_a, this.loaded_square_b, this.preview_produced)
        }
    }
}

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

            this.img_side_pic_dl = expand(this.img_side_pic, 14);

            let img_og_pic_scaled = expand(this.img_og_pic, 10);
            let img_side_pic_scaled = expand(this.img_side_pic, 10);
            this.preview_image.image(img_side_pic_scaled, 260, 0);
            this.preview_image.image(img_og_pic_scaled, 0, 0);

            this.preview_produced = true;
        } else {
            // console.log(this.loaded_side_pic, this.preview_produced)
        }
    }
}

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
            let img_og_pic_scaled = expand(this.img_og_pic, 20);
            this.preview_image.image(img_og_pic_scaled, 0, 0);
            this.preview_produced = true;
        } else {
            // console.log(this.loaded_side_pic, this.preview_produced)
        }
    }
}

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

            this.img_bunny_dl = expand(this.img_bunny, 14);

            let img_og_pic_scaled = expand(this.img_og_pic, 10);
            let img_bunny_scaled = expand(this.img_bunny, 10);
            this.preview_image.image(img_bunny_scaled, 260, 0);
            this.preview_image.image(img_og_pic_scaled, 0, 0);

            this.preview_produced = true;
        } else {
            // console.log(this.loaded_bunny, this.preview_produced)
        }
    }
}

class FleshGeneration {
    constructor(skull_number) {
        this.skull_number = skull_number;



    }
    update() {



    }
}

// DOWNLOAD ////////////////////////////////////////////////////////////////////////////////////////

async function run_download() {
    if (tool_state == WELCOME_GENERATOR_TAB) {
        console.log('downloading gif')
        resizeCanvas(REF_DIM, REF_DIM);
        capturer.save();
        resizeCanvas(PREVIEW_DIM, PREVIEW_DIM);
    } else if (tool_state == HEADER_GENERATION_TAB) {
        console.log('downloading image 1');
        header_generation.img_header.save('CS_Twitter_Header_' + header_generation.skull_number, 'png');
        await sleep(1000);
        console.log('downloading image 2');
        header_generation.img_square_a.save('CS_1x1A_' + header_generation.skull_number, 'png');
        await sleep(1000);
        console.log('downloading image 3');
        header_generation.img_square_b.save('CS_1x1B_' + header_generation.skull_number, 'png');
    } else if (tool_state == SIDE_PIC_GENERATION_TAB) {
        console.log('downloading image');
        side_pic_generation.img_side_pic_dl.save('CS_side_pic_' + side_pic_generation.skull_number, 'png');
    } else if (tool_state == VECTOR_GENERATION_TAB) {
        console.log('downloading vectors');
        var anchor_1 = document.createElement('a');
        anchor_1.href = vector_generation.url_svg_o;
        anchor_1.target = '_blank';
        anchor_1.download = 'CS_vector_' + vector_generation.skull_number + '.svg';
        var anchor_2 = document.createElement('a');
        anchor_2.href = vector_generation.url_svg_t;
        anchor_2.target = '_blank';
        anchor_2.download = 'CS_vector_t_' + vector_generation.skull_number + '.svg';
        anchor_1.click();
        await sleep(1000);
        anchor_2.click();
    } else if (tool_state == BUNNY_GENERATION_TAB) {
        console.log('downloading png');
        bunny_generation.img_bunny_dl.save('CS_bunny_' + bunny_generation.skull_number, 'png');
        var anchor_1 = document.createElement('a');
        anchor_1.href = bunny_generation.url_svg_o;
        anchor_1.target = '_blank';
        anchor_1.download = 'CS_bunny_' + bunny_generation.skull_number + '.svg';
        await sleep(1000);
        console.log('downloading svg');
        anchor_1.click();
    } else if (tool_state == FLESH_GENERATION_TAB) {








    }
}
