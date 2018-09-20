const vec = (x, y) => ({
    x,
    y
});

const add = (a, b) => vec(a.x + b.x, a.y + b.y);
const sum = (...vecs) => vecs.reduce((p, c) => add(p, c), vec(0, 0));
const sub = (a, b) => vec(a.x - b.x, a.y - b.y);
const mul = (a, b) => vec(a.x * b.x, a.y * b.y);
const times = (a, k) => mul(a, vec(k, k));
const dot = (u, v) => u.x * v.x + u.y * v.y;
const len = v => dot(v, v) ** 0.5;
const normalize = v => times(v, 1 / len(v));


const cnv = document.querySelector('#cnv');
const ctx = cnv.getContext('2d');
cnv.width = 800;
cnv.height = 600;

const morph_fator_input = document.querySelector('#morph_factor');
const levels_input = document.querySelector('#levels');

let {
    vertices,
    indices
} = generatePatchGeometry(levels_input.value);

const patch = createPatch(
    vec(0, 1),
    vec(1, 1),
    vec(0.5, 0)
);

const update = () => {
    drawPatch(ctx, patch, vertices, indices, morph_fator_input.value);
};

morph_fator_input.addEventListener('input', update);

levels_input.addEventListener('input', () => {
    const geom = generatePatchGeometry(levels_input.value);
    vertices = geom.vertices;
    indices = geom.indices;

    update();
});

update();

function scaleToCanvas(v) {
    return mul(v, vec(cnv.width - 5, cnv.height - 5));
}

function unindex(vertices, indices) {
    return indices.map(idx => vertices[idx]);
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

function drawPatch(ctx, patch, vertices, indices, morph_factor) {
    const triangles = chunks(unindex(vertices, indices).map(morphVertex(patch, morph_factor)), 3);
    drawTriangles(ctx, triangles, 'steelblue');
}

function drawPatch2(ctx, patch, vertices, morph_factor) {
    const morph = morphVertex(patch, morph_factor);
    drawTriangles(ctx, chunks(vertices.map(morph), 3));
}

function drawTriangle(ctx, a, b, c) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.closePath();
    ctx.stroke();
}

function clearCanvas(ctx, fill_style = 'white') {
    ctx.fillStyle = fill_style;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fill();
}

function drawTriangles(ctx, triangles, stroke_style = 'black', fill_style = 'white') {
    clearCanvas(ctx, fill_style);
    ctx.strokeStyle = stroke_style;

    triangles.forEach(t => {
        const [a, b, c] = t;
        drawTriangle(ctx, a, b, c);
    });
}

function createPatch(a, b, c) {
    return {
        A: a,
        R: sub(b, a),
        S: sub(c, a)
    };
}

const m = createTriangleMorph([
        vec(0, 0),
        vec(1, 0),
        vec(0.5, 1)
    ],
    [
        vec(0.5, 0),
        vec(0.75, 0.5),
        vec(0.25, 0.5)
    ]
);

console.log(m);


function createTriangleMorph(from, to) {
    const [a, b, c] = from;
    const [d, e, f] = to;
    const R = normalize(sub(b, a));
    const S = normalize(sub(c, a));

    const project = v => vec(dot(v, R), dot(v, S));

    console.log(project(R));
    console.log(project(S));

    return [{
            pos: a,
            morph: vec(0, 0)
        },
        {
            pos: b,
            morph: vec(0, 0)
        },
        {
            pos: c,
            morph: vec(0, 0)
        },
        {
            pos: d, //a
            morph: sub(d, a)
        },
        {
            pos: e, //b
            morph: sub(e, b)
        },
        {
            pos: f, //c
            morph: sub(f, c)
        }
    ];
};

// http://robert-lindner.com/blog/planet-renderer-week-5-6/
function generatePatchGeometry(levels) {
    //clear
    const vertices = [];
    const indices = [];

    let positions = [];
    let morphs = [];

    //Generate
    const m_RC = 1 + 2 ** levels;

    const delta = 1 / (m_RC - 1);

    let rowIdx = 0;
    let nextIdx = 0;

    for (let row = 0; row < m_RC; row++) {
        const numCols = m_RC - row;
        nextIdx += numCols;
        for (let column = 0; column < numCols; column++) {
            //calc position
            const pos = [
                column / (m_RC - 1),
                row / (m_RC - 1)
            ];

            //calc morph
            const morph = [0, 0];
            if (row % 2 == 0) {
                if (column % 2 == 1) {
                    morph[0] = -delta;
                    morph[1] = 0;
                }
            } else {
                if (column % 2 == 0) {
                    morph[0] = 0;
                    morph[1] = delta;
                } else {
                    morph[0] = delta;
                    morph[1] = -delta;
                }
            }

            //create vertex
            positions.push(...pos);
            morphs.push(...morph);
            vertices.push({
                pos: vec(...pos),
                morph: vec(...morph)
            });

            //calc index
            if (row < m_RC - 1 && column < numCols - 1) {
                indices.push(rowIdx + column); //A
                indices.push(nextIdx + column); //B
                indices.push(1 + rowIdx + column); //C
                if (column < numCols - 2) {
                    indices.push(nextIdx + column); //D
                    indices.push(1 + nextIdx + column); //E
                    indices.push(1 + rowIdx + column); //F
                }
            }
        }
        rowIdx = nextIdx;
    }

    return {
        vertices,
        indices
    };
};