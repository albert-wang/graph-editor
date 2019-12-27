import { Curve } from "@/shared/curves";

export class Animation {
    curves: Curve[] = [];
    frame: number = 0;

    public evaluate<T extends object>(f: number, output: T) {
        this.curves.forEach((c) => {
            if (output.hasOwnProperty(c.name)) {
                // @ts-ignore
                output[key] = c.evaluate(f);
            }
        });

        return output;
    }
}


export default class GraphDriver {
    public static loadAnimation(animatino: string): Animation {
        const result = new Animation();

        

        return result;
    }
}