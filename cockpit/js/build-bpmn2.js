/*
  This file is part of cpee-layout.

  cpee-layout is free software: you can redistribute it and/or modify it under
  the terms of the GNU Lesser General Public License as published by the Free
  Software Foundation, either version 3 of the License, or (at your option) any
  later version.

  cpee-layout is distributed in the hope that it will be useful, but WITHOUT
  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
  FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
  details.

  You should have received a copy of the GNU Lesser General Public License
  along with cpee-layout (file LICENSE in the main directory). If not, see
  <http://www.gnu.org/licenses/>.

  The CPEE type mapping and the BPMN output follow build-bpmn.js,
  Copyright 2026 David Kindermann (Apache-2.0).
*/

//
// build-bpmn2.js
//
// Creates BPMN XML from wfadaptor's get_svg_metrics():
// bpmn2_convert(pos_matrix, con_list, lr, geometry), like david_bpmn_convert of
// build-bpmn.js plus the orientation and the geometry of the drawing. Rows and columns are
// 0-indexed.
//
// Unlike build-bpmn.js, the layout is not computed again: every symbol is
// placed where the metrics (and so the SVG) have it, and the flows are drawn
// with right angles only, entering their targets perpendicularly.
//
//   1) nodes   cells → BPMN shapes, or placeholders that flows pass through
//   2) flows   con_list, followed through placeholders from shape to shape
//   3) route   right-angled waypoints, bending where the placeholders are
//   4) xml     process and diagram interchange
//

// the svg rows (geometry.row apart) are spread to ROW here, so that tasks have
// the bpmn-js default height (rows are vertical in lr as well)
const SYM = 30;           // symbol size
const TASK_H = 80;        // task height, as bpmn-js; its icon is in the top left corner, so one line of text stays below it
const ROW = TASK_H + 10;  // row distance, the gap stays as in the svg
const GAP = 10;           // space between a task and the next symbol
const SPACE = 10;         // extra space in front of every column, the svg is a bit tight for bpmn
const PAD = 20;          // tasks are this much wider on both sides, bpmn-js puts its text close to the border
const BACK = 20;         // flows that go around (loops) go back this far right of the target's line

// cpee types → BPMN element (kind) and event definition (def), or placeholder.
// Tasks, and all types not listed, get their kind from the subtype
const TYPE_MAP = {
    description: { kind: "startEvent" },
    start_event: { kind: "startEvent", def: "message" },
    event_start: { kind: "startEvent", def: "signal" }, // the start of a signal branch
    end: { kind: "endEvent" },
    end_event: { kind: "endEvent", def: "message" },
    event_end: { kind: "endEvent", def: "terminate" },
    terminate: { kind: "endEvent", def: "terminate" },
    call: { task: true },
    callmanipulate: { task: true },
    manipulate: { task: true },
    loop_head: { kind: "exclusiveGateway" },
    loop_tail: { kind: "exclusiveGateway" },
    loop_finish: { kind: "exclusiveGateway" },
    loop_tail_pre: { kind: "exclusiveGateway" },   // presetlr: pre_test loops
    loop_finish_pre: { kind: "exclusiveGateway" },
    parallel_start: { kind: "parallelGateway" },
    parallel_simple: { kind: "parallelGateway" },
    parallel_complex: { kind: "complexGateway" },
    parallel_eventbased_parallel: { kind: "complexGateway" },
    parallel_branch_event: { kind: "intermediateThrowEvent", def: "signal" },
    parallel_branch_event_rev: { kind: "intermediateThrowEvent", def: "signal" },
    parallel_branch_normal: { placeholder: "pass" },
    choose_inclusive: { kind: "inclusiveGateway" },
    choose_inclusive_finish: { kind: "inclusiveGateway" },
    choose_exclusive: { kind: "exclusiveGateway" },
    choose_exclusive_finish: { kind: "exclusiveGateway" },
    alternative: { placeholder: "case" },   // its label names the flow
    otherwise: { placeholder: "default" },  // its label names the flow, without one the flow is the default
    stop: { placeholder: "pass" }
};
const TASK_SUBTYPES = { user: "userTask", service: "serviceTask", script: "scriptTask" };
const EVENT_SUBTYPES = {
    timer: { kind: "intermediateCatchEvent", def: "timer" },
    message_receive: { kind: "intermediateCatchEvent", def: "message" },
    message_send: { kind: "intermediateThrowEvent", def: "message" }
};

const fmt = (n) => Number(n).toFixed(2).replace(/\.?0+$/, "");
const key = (r, c) => r + "," + c;
function xmlEscape(s = "") {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function xmlEventDef(def, id) {
    return def ? `<${def}EventDefinition id="${id}_def"/>` : "";
}
function xmlSignavioBg(color) { // Signavio: background color per shape
    return `<extensionElements><signavio:signavioMetaData metaKey="bgcolor" metaValue="${xmlEscape(color || "#ffffff")}"/></extensionElements>`;
}

// 1) nodes: kind is the BPMN element, or null for placeholders. Names are the
// labels only, the svg has no room for more. x is where the symbol is drawn,
// mid the middle of its row, labelBox where its label is, relative to the symbol
function buildNodes(matrix, geometry) {
    const nodes = new Map();
    let n = 0;
    matrix.forEach((row, r) => (row || []).forEach((cell, c) => {
        if (!cell) return;
        const t = TYPE_MAP[cell.type] || { task: true };
        const node = { r, c, x: cell.x - geometry.shift + SPACE * c, mid: r * ROW + geometry.top + TASK_H / 2, width: cell.width, fill: cell.fill, id: "n" + (++n), kind: null, label: cell.label || null };
        const l = cell.label_box;
        if (l) node.labelBox = { dx: l.x - (cell.x - geometry.shift), dy: l.y - (geometry.top + r * geometry.row), w: l.width, h: l.height };
        if (!t.task) {
            Object.assign(node, t);
        } else { // the subtype comes from the endpoint's properties (cockpit only)
            const sub = typeof cell.subtype === "string" ? cell.subtype : "";
            const ev = sub.startsWith("event/") ? (EVENT_SUBTYPES[sub.split("/").slice(1).join("_")] || EVENT_SUBTYPES[sub.split("/")[1]] || { kind: "intermediateCatchEvent" }) : null;
            if (ev) {
                Object.assign(node, { kind: ev.kind, def: ev.def });
            } else {
                node.kind = sub == "marker/subprocess" ? "subProcess"
                    : sub.startsWith("task/") ? (TASK_SUBTYPES[sub.split("/")[1]] || "serviceTask")
                    : cell.type == "manipulate" ? "scriptTask" : "serviceTask";
            }
        }
        nodes.set(key(r, c), node);
    }));
    // every column after one with a task moves by the width tasks gain
    const taskCols = new Set([...nodes.values()].filter(isTask).map((n) => n.c));
    for (const n of nodes.values()) n.x += 2 * PAD * [...taskCols].filter((c) => c < n.c).length;
    return nodes;
}

// bounds as in the svg: tasks span their label and the row, everything else
// is a symbol in the middle of the row
function bounds(node) {
    const x = node.x;
    if (!node.kind) return { x: x + SYM / 2, y: node.mid, w: 0, h: 0 }; // placeholders are points
    if (isTask(node)) return { x, y: node.mid - TASK_H / 2, w: Math.max(SYM, node.width - GAP) + 2 * PAD, h: TASK_H };
    return { x, y: node.mid - SYM / 2, w: SYM, h: SYM };
}
const isTask = (node) => /Task$|^subProcess$/.test(node.kind);

// labels of events, gateways and placeholders are where the svg shows them,
// relative to their symbol. Labels the svg does not show have no bounds
function labelBounds(node) {
    const l = node.labelBox;
    return l ? { x: node.x + l.dx, y: node.mid - SYM / 2 + l.dy, w: l.w, h: l.h } : null;
}

// 2) flows from shape to shape, following con_list through placeholders
function buildFlows(nodes, conlist) {
    const out = new Map();
    for (const e of conlist) {
        const f = key(e.from.row, e.from.col), t = key(e.to.row, e.to.col);
        if (!nodes.has(f) || !nodes.has(t)) throw new Error("bpmn2_convert: con_list connects an empty cell, " + f + " -> " + t);
        if (!out.has(f)) out.set(f, []);
        out.get(f).push(t);
    }
    const flows = [];
    const seen = new Set();
    for (const [k, src] of nodes) {
        if (!src.kind) continue;
        const walk = (from, via, anchor, visited) => {
            for (const t of out.get(from) || []) {
                const n = nodes.get(t);
                if (n.kind) {
                    const sig = src.id + ">" + n.id;
                    if (seen.has(sig)) continue;
                    seen.add(sig);
                    flows.push({ src, dst: n, via, anchor });
                } else if (!visited.has(t)) {
                    visited.add(t);
                    walk(t, via.concat([n]), n.placeholder != "pass" ? n : anchor, visited);
                }
            }
        };
        walk(k, [], null, new Set([k]));
    }
    for (const f of flows) {
        if (!f.anchor) continue;
        if (f.anchor.label) f.name = f.anchor.label;
        else if (f.anchor.placeholder == "default" && f.src.kind == "exclusiveGateway") f.isDefault = true;
    }
    return flows;
}

// 3) right angles only. a is the position along the flow, c across it
function route(flow, lr, nodes) {
    const P = (a, c) => lr ? { x: a, y: c } : { x: c, y: a };
    const box = (n) => {
        const b = bounds(n);
        const s = { x: n.kind ? b.x + SYM / 2 : b.x, y: n.mid }; // the symbol, not the label
        const next = n.mid + ROW / 2; // between this row and the next
        return lr ? { n, a: s.x, c: s.y, a0: b.x, a1: b.x + b.w, c0: b.y, c1: b.y + b.h, turn: GAP / 2 }
                  : { n, a: s.y, c: s.x, a0: b.y, a1: b.y + b.h, c0: b.x, c1: b.x + b.w, turn: next - (b.y + b.h) };
    };
    const shapes = [...nodes.values()].filter((n) => n.kind).map(box);
    const blocking = (c, from, to, except) => shapes.filter((b) => !except.includes(b.n) && b.c0 <= c && c <= b.c1 && b.a1 > Math.min(from, to) && b.a0 < Math.max(from, to));
    // a leg follows its own direction (dir), forwards or backwards along the flow
    const leg = (s, d) => {
        const dA = d.a - s.a, dC = d.c - s.c, dir = dA < 0 ? -1 : 1, except = [s.n, d.n];
        const out = dir > 0 ? s.a1 : s.a0, into = dir > 0 ? d.a0 : d.a1;                   // the sides facing each other
        if (Math.abs(dA) < 0.5) return dC > 0 ? [P(s.a, s.c1), P(d.a, d.c0)] : [P(s.a, s.c0), P(d.a, d.c1)]; // straight across
        if (Math.abs(dC) < 0.5 && !blocking(s.c, s.a, d.a, except).length) return [P(out, s.c), P(into, d.c)]; // straight along
        if (dC > 0 && !blocking(d.c, s.a, d.a, except).length) return [P(s.a, s.c1), P(s.a, d.c), P(into, d.c)]; // branch out: across, then along into the target
        if (dC < 0 && !blocking(s.c, s.a, d.a, except).length) return [P(out, s.c), P(d.a, s.c), P(d.a, d.c1)]; // join: along, then across into the target
        // shapes in the way (e.g. the content of a loop): leave on the far side, turn,
        // and go back parallel to the target's line, BACK beside it on the right (or
        // beside what is in the way). Symbols are entered at 45 degrees
        const far = dir > 0 ? s.a0 : s.a1, turn = far - dir * s.turn;
        const inway = blocking(d.c + BACK, turn, into, except);
        const lane = inway.length ? Math.max(...inway.map((b) => b.c1)) + BACK : d.c + BACK;
        if (d.n.kind && !isTask(d.n)) {
            const edge = /Gateway$/.test(d.n.kind) ? SYM / 4 : SYM / 2 / Math.SQRT2; // the border at 45 degrees: diamond or circle
            return [P(far, s.c), P(turn, s.c), P(turn, lane), P(d.a - dir * (lane - d.c), lane), P(d.a - dir * edge, d.c + edge)];
        }
        const end = lane <= d.c1 ? [P(into, lane)] : [P(d.a, lane), P(d.a, d.c1)];
        return [P(far, s.c), P(turn, s.c), P(turn, lane)].concat(end);
    };
    // source and target on one line, along or across the flow: straight, unless
    // another shape is in the way (e.g. the content of a loop)
    const s = box(flow.src), d = box(flow.dst), except = [flow.src, flow.dst];
    const across = shapes.some((b) => !except.includes(b.n) && b.a0 <= s.a && s.a <= b.a1 && b.c1 > Math.min(s.c, d.c) && b.c0 < Math.max(s.c, d.c));
    if (flow.src !== flow.dst) {
        if (Math.abs(d.c - s.c) < 0.5 && !blocking(s.c, s.a, d.a, except).length) return d.a > s.a ? [P(s.a1, s.c), P(d.a0, d.c)] : [P(s.a0, s.c), P(d.a1, d.c)];
        if (Math.abs(d.a - s.a) < 0.5 && !across) return d.c > s.c ? [P(s.a, s.c1), P(d.a, d.c0)] : [P(s.a, s.c0), P(d.a, d.c1)];
    }

    const stops = [flow.src].concat(flow.via, [flow.dst]).map(box);
    let pts = [];
    for (let i = 0; i < stops.length - 1; i++) pts = pts.concat(leg(stops[i], stops[i + 1]));
    // drop repeated points and points in the middle of a straight line
    pts = pts.filter((p, i) => i == 0 || p.x != pts[i - 1].x || p.y != pts[i - 1].y);
    return pts.filter((p, i) => {
        if (i == 0 || i == pts.length - 1) return true;
        const a = pts[i - 1], b = pts[i + 1];
        return !((a.x == p.x && p.x == b.x) || (a.y == p.y && p.y == b.y));
    });
}

// 4) xml
function generateXML(nodes, flows, lr) {
    const shapes = [...nodes.values()].filter((n) => n.kind);
    flows.forEach((f, i) => { f.id = "e" + (i + 1); });
    const defaults = new Map(flows.filter((f) => f.isDefault).map((f) => [f.src.id, f.id]));
    const nameAttr = (s) => s ? ` name="${xmlEscape(s)}"` : "";

    const proc = shapes.map((s) => {
        const def = defaults.has(s.id) ? ` default="${defaults.get(s.id)}"` : "";
        return `    <${s.kind} id="${s.id}"${nameAttr(s.label)}${def}>${xmlSignavioBg(s.fill)}${xmlEventDef(s.def, s.id)}</${s.kind}>`;
    }).concat(flows.map((f) =>
        `    <sequenceFlow id="${f.id}" sourceRef="${f.src.id}" targetRef="${f.dst.id}"${nameAttr(f.name)}/>`
    )).join("\n");

    const xmlBounds = (b, indent) => `${indent}<omgdc:Bounds x="${fmt(b.x)}" y="${fmt(b.y)}" width="${fmt(b.w)}" height="${fmt(b.h)}"/>\n`;
    const xmlLabel = (b) => b ? `        <bpmndi:BPMNLabel>\n${xmlBounds(b, "          ")}        </bpmndi:BPMNLabel>\n` : "";
    const di = shapes.map((s) => {
        const marker = /Gateway$/.test(s.kind) ? ' isMarkerVisible="true"' : "";
        return `      <bpmndi:BPMNShape id="${s.id}_gui" bpmnElement="${s.id}"${marker}>\n` +
               xmlBounds(bounds(s), "        ") +
               xmlLabel(s.label && !isTask(s) ? labelBounds(s) : null) +
               `      </bpmndi:BPMNShape>`;
    }).concat(flows.map((f) =>
        `      <bpmndi:BPMNEdge id="${f.id}_gui" bpmnElement="${f.id}">\n` +
        route(f, lr, nodes).map((p) => `        <omgdi:waypoint x="${fmt(p.x)}" y="${fmt(p.y)}"/>`).join("\n") + "\n" +
        xmlLabel(f.name ? labelBounds(f.anchor) : null) +
        `      </bpmndi:BPMNEdge>`
    )).join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<definitions
  xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI"
  xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:signavio="http://www.signavio.com"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  targetNamespace="https://example.com/bpmn"
>
  <process id="process1" isExecutable="false">
${proc}
  </process>
  <bpmndi:BPMNDiagram id="diagram1">
    <bpmndi:BPMNPlane id="plane1" bpmnElement="process1">
${di}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;
}

// returns the BPMN XML as a string
function bpmn2_convert(dpm, dcl, lr, geometry) {
    if (!Array.isArray(dpm) || !Array.isArray(dcl) || typeof lr !== "boolean" || !geometry) throw new Error("bpmn2_convert: needs pos_matrix, con_list, lr and geometry of get_svg_metrics");
    const nodes = buildNodes(dpm, geometry);
    return generateXML(nodes, buildFlows(nodes, dcl), lr);
}

if (typeof window !== "undefined") {
    window.bpmn2_convert = bpmn2_convert;
}
