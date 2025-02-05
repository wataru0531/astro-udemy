/**************************************************************

gray-pic

***************************************************************/
import { Ob } from "../Ob";

import vertexShader from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";

// import { BoxGeometry } from "three";

export default class extends Ob {
    setupVertex() {
        return vertexShader;
    }
    setupFragment() {
        return fragmentShader;
    }
}
