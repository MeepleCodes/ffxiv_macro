/**
 * A custom Konva shape (and konva-react component) that fixes the bounding
 * boxes for Arc/Wedge by making the arc angle symmetric around 0 rather than
 * clockwise/anticlockwise from 0.
 */
import Konva from "konva";
import { Context } from "konva/lib/Context";
import { Shape, ShapeConfig } from "konva/lib/Shape";
import { getNumberValidator } from "konva/lib/Validators";
import { _registerNode } from "konva/lib/Global";
import { KonvaNodeComponent } from "react-konva";

export interface ConeConfig extends ShapeConfig {
  angle: number;
  radius: number;
}

const numVal = getNumberValidator();

export class ConeShape extends Shape<ConeConfig> {
  _sceneFunc(context: Context): void {
    const angleRad = Konva.getAngle(this.angle());
    context.beginPath();
    context.arc(
      0,
      0,
      this.radius(),
      angleRad/2,
      -angleRad/2,
      true
    );
    context.lineTo(0, 0);
    context.closePath();
    context.fillStrokeShape(this);
  }
  getSelfRect(): { x: number; y: number; width: number; height: number; } {
    const angleRad = Math.min(Konva.getAngle(this.angle()), Math.PI * 2);
    const x = angleRad < Math.PI ? 0 : 0 - (this.radius() * Math.sin((angleRad - Math.PI)/2));
    const halfHeight = angleRad > Math.PI ? this.radius() : (this.radius() * Math.sin(angleRad/2));
    const y = -halfHeight;
    const height = halfHeight * 2;
    const width = this.radius() - x;
    return {x, y, width, height};
  }
  getWidth() {
    return this.radius() * 2;
  }
  getHeight() {
    return this.radius() * 2;
  }
  setWidth(width: number) {
    this.radius(width / 2);
  }
  setHeight(height: number) {
    this.radius(height / 2);
  }
  // We can't use Konva's Factory.addGetterSetter here because we aren't running
  // with "strictPropertyInitialization": false in our tsconfig and I don't want
  // to enable it just for one file. So, we just have to do the getter/setters
  // by hand.

  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  getRadius(): number {
    return (this.attrs["radius"] ?? 0) as number;
  }
  setRadius(value: number): this {
    numVal?.(value, "radius");
    this._setAttr("radius", value);
    return this;
  }
  radius(): number;
  radius(value: number): this;
  radius(value?: number): number|this {
    if(value !== undefined) return this.setRadius(value);
    return this.getRadius();
  }
  getAngle(): number {
    return (this.attrs["angle"] ?? 0) as number;
  }
  setAngle(value: number): this {
    numVal?.(value, "angle");
    this._setAttr("angle", value);
    return this;
  }
  angle(): number;
  angle(value: number): this;
  angle(value?: number): number|this {
    if(value !== undefined) return this.setAngle(value);
    return this.getAngle();
  }

  /* eslint-enable @typescript-eslint/no-unsafe-member-access */
}

ConeShape.prototype.className = "Cone";
ConeShape.prototype._attrsAffectingSize = ["radius", "angle"];
_registerNode(ConeShape);


// Konva-react 'components' are actually string constants, and it's the Stage
// component that takes [string, props] and turns it into canvas actions. Lie
// through our teeth to typescript to make it think it's a regular JSX component
export const Cone: KonvaNodeComponent<ConeShape, ConeConfig> = "Cone" as unknown as KonvaNodeComponent<ConeShape, ConeConfig>;
