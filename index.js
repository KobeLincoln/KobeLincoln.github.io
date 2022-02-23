//
const gif_frame_rate = 2;
const gif_frame_count = 21;
const skull_dim = 24;
const REF_DIM = 1000;
const PREVIEW_DIM = 500;
var USE_DIM = REF_DIM;


////////////////////////////////////////////////////////////////////////////////////////////////////

function copyImage(img) {
    let img_new = createImage(img.width, img.height)
    img_new.copy(img, 0, 0, img.width, img.height, 0, 0, img_new.width, img_new.height)
    return img_new
}

function myImage(img) {
    let scaled_width = max(1, USE_DIM)
    let scaled_height = max(1, USE_DIM)
    if (img.width != scaled_width || img.height != scaled_height) {
        let img_scaled = copyImage(img)
        img_scaled.resize(scaled_width, scaled_height)
        image(img_scaled, 0, 0)
    } else {
        image(img, 0, 0)
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////

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
    return color(img.pixels[index], img.pixels[index+1], img.pixels[index+2])
}

function expand(img, multiple) {
    let w_o = img.width;
    let w = w_o*multiple;
    let h = img.height*multiple;
    let img_out = createImage(w, h);
    img.loadPixels();
    img_out.loadPixels();
    let img_out_index;
    for (let i=0; i<w; i++) {
        for (let j=0; j<h; j++) {
            for (let k=0; k<4; k++) {
                img_out_index = (i + j * w) * 4 + k;
                img_index = (floor(i/multiple) + floor(j/multiple) * w_o) * 4 + k;
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
    for (let i=0; i<img.width; i++) {
        for (let j=0; j<img.height; j++) {
            index = (i + j * img.width) * 4
            // checking red channel only
            if (img.pixels[index] == 0) {
                color_replace = color_white;
            } else {
                color_replace = color_black;
            }
            for (let k=0; k<4; k++) {
                img_out.pixels[index+k] = color_replace.levels[k]
            }
        }
    }
    img_out.updatePixels();
    return img_out;
}

function colors_match(color1, color2) {
    for (let k=0; k<4; k++) {
        if (color1.levels[k] != color2.levels[k]) {
            return false;
        }
    }
    return true;
}


function get_expand_width_textsize(graphic, str, max_width) {
    for (let s=2; s<1000; s+=2) {
        graphic.textSize(s);
        graphic.textLeading(s/2);
        if (graphic.textWidth(str) > max_width) {
            return s-2;
        }
    }
}


////////////////////////////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////////////////////////////

var canvas_gif;

preload = function() {
    img_cryptoskulls = loadImage('./img/cryptoskulls.png')
    img_sn1 = loadImage('./img/skullnation1.png')
    img_sn2 = loadImage('./img/skullnation2.png')
    img_sn3 = loadImage('./img/skullnation3.png')
    font_cs = loadFont('./font/cryptoskulls.otf')
}

setup = function() {
    div_preview = 'canvasForHTML';
    div_capture = 'canvasForGif';
    canvas_gif = createCanvas(REF_DIM, REF_DIM);
    canvas_gif.parent(div_capture);

    input_number = createInput();
    input_number.parent(div_preview);
    input_number.attribute('placeholder', 'ENTER SKULL #');
    input_number.position(15, 100);

    input_handle = createInput();
    input_handle.attribute('placeholder', 'TWITTER @HANDLE');
    input_handle.parent(div_preview);
    input_handle.position(15, 175);

    input_longname = createInput();
    input_longname.attribute('placeholder', 'TWITTER LONG NAME');
    input_longname.parent(div_preview);
    input_longname.position(15, 250);

    button_generate = createButton('GENERATE');
    button_generate.parent(div_preview);
    button_generate.position(15, 350);
    button_generate.mousePressed(run_generate);

    button_download = createButton('DOWNLOAD GIF');
    button_download.parent(div_preview);
    button_download.position(15, 600);
    button_download.mousePressed(run_download);

    button_restart = createButton('RESTART');
    button_restart.parent(div_preview);
    button_restart.position(330, 600);
    button_restart.mousePressed(run_restart);

    err_number = createElement('h3', 'INVALID SKULL NUMBER!');
    err_number.parent(div_preview);
    err_number.position(15, 450);
    err_number.hide()

    err_handle = createElement('h3', 'INVALID TWITTER HANDLE!');
    err_handle.parent(div_preview);
    err_handle.position(15, 450);
    err_handle.hide()

    err_longname = createElement('h3', 'INVALID TWITTER LONG NAME!');
    err_longname.parent(div_preview);
    err_longname.position(15, 450);
    err_longname.hide()

    msg_processing = createElement('h2', 'SKULLIFYING A WELCOME...');
    msg_processing.parent(div_preview);
    msg_processing.position(15, 525);
    msg_processing.hide()

    frameRate(gif_frame_rate);
    noLoop();
}


////////////////////////////////////////////////////////////////////////////////////////////////////

var captured_frames;
var capturer;
is_looping_state = false; // for detecting changes in state
is_capture_state = false;
is_preview_state = false;
base_frame_count = 0;

draw = function() {

    if (!is_looping_state && isLooping()) {
        base_frame_count = frameCount;
        // console.log('base_frame_count', base_frame_count)
        is_looping_state = true;

    } else if (is_looping_state && !isLooping()) {
        is_looping_state = false;
        is_preview_state = false;
    }

    if (frameCount - base_frame_count == 0) {
        is_capture_state = true;
        // console.log('starting capture');
        captured_frames = 0;
        capturer = new CCapture({
                                framerate: gif_frame_rate,
                                format: "gif",
                                workersPath:"./",
                                name: "welcome_"+generation.skull_number,
                                quality: 100,
                                verbose: false,
                            });
        capturer.start();
    }

    if (is_preview_state && canvas_gif.parent() != div_preview) {
        button_download.show();
        msg_processing.hide();
        resizeCanvas(PREVIEW_DIM, PREVIEW_DIM)
        canvas_gif.parent(div_preview);
    }

    if (isLooping()) {
        frame_index = (frameCount - base_frame_count) % gif_frame_count
        clear()
        myImage(generation.images[frame_index])
    } else {
        draw_splash();
    }

    if (is_capture_state) {
        capturer.capture(canvas_gif.canvas);
        captured_frames += 1;
    }
    if (is_capture_state && captured_frames >= gif_frame_count) {
        is_capture_state = false;
        capturer.stop();        
        USE_DIM = PREVIEW_DIM;
        is_preview_state = true;
    }

}

function draw_splash() {
    background(0);
    input_number.show();
    input_number.value('');
    input_handle.show();
    input_handle.value('');
    input_longname.show();
    input_longname.value('');
    button_generate.show();
    button_download.hide();
    button_restart.hide();
}


////////////////////////////////////////////////////////////////////////////////////////////////////


var generation;
var skull_number;
function run_generate() {

    skull_number = parseInt(input_number.value());
    twitter_handle = input_handle.value();
    twitter_longname = input_longname.value();
    // console.log('run_generate', skull_number, twitter_handle, twitter_longname)

    if (input_number.value() == '' || skull_number == undefined || skull_number < 1 || skull_number > 10000) {
        // console.log('invalid skull number input');
        err_number.show();
        return;
    }
    if (twitter_handle == undefined || twitter_handle == '') {
        // console.log('invalid twitter handle input');
        err_handle.show();
        return;
    }
    if (twitter_longname == undefined || twitter_longname == '') {
        // console.log('invalid twitter long name input');
        err_longname.show();
        return;
    }

    input_number.hide();
    input_handle.hide();
    input_longname.hide();
    button_generate.hide();
    err_number.hide();
    err_handle.hide();
    err_longname.hide();
    button_restart.show();
    msg_processing.show();

    generation = new Generation(skull_number, twitter_handle, twitter_longname);
    loop();
}

function run_download() {
    console.log('downloading gif')
    resizeCanvas(REF_DIM, REF_DIM);
    capturer.save();
    resizeCanvas(PREVIEW_DIM, PREVIEW_DIM);
}

function run_restart() {
    // console.log('restarting');
    USE_DIM = REF_DIM;
    resizeCanvas(REF_DIM, REF_DIM);
    canvas_gif.parent(div_capture);
    noLoop();
}


////////////////////////////////////////////////////////////////////////////////////////////////////


function Generation(skull_number, twitter_handle, twitter_longname) {
    this.skull_number = skull_number;
    this.twitter_handle = twitter_handle;
    this.twitter_longname = twitter_longname;

    this.produce = function() {

        console.log('generating', this.skull_number, this.twitter_handle, this.twitter_longname)

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
        for (let i=0; i<gif_frame_count; i++) {
            this.images.push(this.generate_frame(i))
        }
    }

    this.expansions = [19, 30, 45, 109, 187];
    
    this.generate_frame = function(frame_index) {
        let graphic = createGraphics(REF_DIM, REF_DIM)
        graphic.textAlign(CENTER, CENTER);
        graphic.textFont(font_cs);

        if (frame_index <= 10) {
            graphic.background(this.color_bg);
            graphic.fill(this.color_skull);
        } else if (frame_index <= 14) {
            graphic.background(this.color_skull);
            graphic.textSize(REF_DIM/3);
            graphic.textLeading(REF_DIM/6);
            graphic.fill(this.color_bg);
        } else {
            graphic.clear();
        }
        let s, str;
        switch (true) {
            case frame_index <= 1:
                s = get_expand_width_textsize(graphic, 'CRYPTO', REF_DIM*0.95);
                // console.log('text size', s)
                graphic.textSize(s);
                graphic.textLeading(s/2);
                graphic.text('CRYPTO\nSKULL', REF_DIM/2,  REF_DIM/2);
                break;
            case frame_index <= 3:
                str = '#' + this.skull_number;
                s = get_expand_width_textsize(graphic, str, REF_DIM*0.95);
                // console.log('text size', s)
                graphic.textSize(s);
                graphic.text(str, REF_DIM/2,  REF_DIM/2)
                break;
            case frame_index <= 8:
                img_resized = expand(this.img_skull, this.expansions[frame_index-4]);
                x = (REF_DIM-img_resized.width) / 2;
                y = (REF_DIM-img_resized.height) / 2;
                graphic.image(img_resized, x, y);
                break;
            case frame_index <= 10:
                s = min(get_expand_width_textsize(graphic, this.twitter_handle, REF_DIM*0.95),
                        get_expand_width_textsize(graphic, this.twitter_longname, REF_DIM*0.95));
                // console.log('text size', s)
                graphic.textSize(s);
                graphic.textLeading(s/2);
                graphic.text(this.twitter_handle+'\n'+this.twitter_longname, REF_DIM/2, REF_DIM/2);
                break;
            case frame_index <= 12:
                graphic.text('WELCOME', REF_DIM/2, REF_DIM/2);
                break;
            case frame_index <= 14:
                graphic.text('TO', REF_DIM/2, REF_DIM/2);
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
        return graphic
    }

    this.produce()
}