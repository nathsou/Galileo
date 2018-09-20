const cnv = document.querySelector('#cnv');
const ctx = cnv.getContext('2d');
cnv.width = 600;
cnv.height = 600;

const morph_fator_input = document.querySelector('#morph_factor');
const levels_input = document.querySelector('#levels');

let vertices = generatePatchGeometry(levels_input.value);

const patch = createPatch(
    vec(0, 0),
    vec(1, 0),
    vec(0, 1)
);

const update = () => {
    drawPatch(ctx, patch, vertices, morph_fator_input.value);
};

morph_fator_input.addEventListener('input', update);

levels_input.addEventListener('input', () => {
    vertices = generatePatchGeometry(levels_input.value);

    update();
});

update();

function scaleToCanvas(v) {
    return mul(v, vec(cnv.width - 5, cnv.height - 5));
}

function chunks(array, len) {
    const subarrays = [];
    for (let i = 0; i < array.length; i += len) {
        subarrays.push(array.slice(i, i + len));
    }
    return subarrays;
}

function morphVertex(patch, morph_factor) {
    return vert => {
        const {
            A,
            R,
            S
        } = patch;
        const {
            pos,
            morph
        } = vert;

        return scaleToCanvas(sum(A, times(R, pos.x), times(S, pos.y),
            times(sum(times(R, morph.x), times(S, morph.y)), morph_factor)));
    };
}

function drawPatch(ctx, patch, vertices, morph_factor) {
    const quads = chunks(vertices.map(morphVertex(patch, morph_factor)), 4);
    drawQuads(ctx, quads, 'steelblue');
}

function drawQuad(ctx, a, b, c, d) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(d.x, d.y);
    ctx.closePath();
    ctx.stroke();
}

function clearCanvas(ctx, fill_style = 'white') {
    ctx.fillStyle = fill_style;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fill();
}

function drawQuads(ctx, quads, stroke_style = 'black', fill_style = 'white') {
    clearCanvas(ctx, fill_style);
    ctx.strokeStyle = stroke_style;

    quads.forEach(q => {
        const [a, b, c, d] = q;
        drawQuad(ctx, a, b, c, d);
    });
}


function vec(x, y) {
    return {
        x,
        y
    };
}

function add(a, b) {
    return vec(a.x + b.x, a.y + b.y);
}

function sum(...vecs) {
    return vecs.reduce((p, c) => add(p, c), vec(0, 0));
}

function sub(a, b) {
    return vec(a.x - b.x, a.y - b.y);
}

function mul(a, b) {
    return vec(a.x * b.x, a.y * b.y);
}

function times(a, k) {
    return mul(a, vec(k, k));
}

function createPatch(a, b, c) {
    return {
        A: a,
        R: sub(b, a),
        S: sub(c, a)
    };
}


function generatePatchGeometry(levels) {

    const p0 = vec(0, 0);
    const p1 = vec(1, 0);
    const p2 = vec(1, 1);
    const p3 = vec(0, 1);
    const p4 = vec(0.5, 0);
    const p5 = vec(0.5, 0.5);
    const p6 = vec(0, 0.5);
    const p7 = vec(1, 0.5);
    const p8 = vec(0.5, 1);

    return [{
            pos: p0,
            morph: vec(0, 0)
        },
        {
            pos: p1,
            morph: vec(0, 0)
        }, {
            pos: p2,
            morph: vec(0, 0)
        }, {
            pos: p3,
            morph: vec(0, 0)
        },


        {
            pos: p0,
            morph: vec(0, 0)
        },
        {
            pos: p4,
            morph: vec(0.5, 0)
        },
        {
            pos: p5,
            morph: vec(0.5, 0.5)
        },
        {
            pos: p6,
            morph: vec(0, 0.5)
        },


        {
            pos: p4,
            morph: vec(-0.5, 0)
        },
        {
            pos: p1,
            morph: vec(0, 0)
        },
        {
            pos: p7,
            morph: vec(0, 0.5)
        },
        {
            pos: p5,
            morph: vec(-0.5, 0.5)
        },

        {
            pos: p5,
            morph: vec(-0.5, -0.5)
        },
        {
            pos: p7,
            morph: vec(0, -0.5)
        },
        {
            pos: p2,
            morph: vec(0, 0)
        },
        {
            pos: p8,
            morph: vec(-0.5, 0)
        },

        {
            pos: p6,
            morph: vec(0, -0.5)
        },
        {
            pos: p5,
            morph: vec(0.5, -0.5)
        },
        {
            pos: p8,
            morph: vec(0.5, 0)
        },
        {
            pos: p3,
            morph: vec(0, 0)
        },

    ];

    /*

    3-------8-------2
    |       |       |
    |       |       |
    6-------5-------7
    |       |       |
    |       |       |
    0-------4-------1

    */
};