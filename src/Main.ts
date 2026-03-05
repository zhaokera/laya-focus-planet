const { regClass, Event } = Laya;

@regClass("84f89060-d701-4411-b5dc-ae6e4a05aed0", "../src/Main.ts")
export class Main extends Laya.Scene {
    private currentDifficulty: number = 3;
    private readonly designW: number = 750;
    private readonly designH: number = 1334;
    private root: Laya.Sprite = null;
    private uiScale: number = 1;
    private safeTop: number = 0;
    private safeBottom: number = 0;
    private floatCards: Laya.Sprite[] = [];
    private floatCardBaseY: number[] = [];
    private floatCardBaseRot: number[] = [];
    private particleDots: Laya.Sprite[] = [];
    private startBtn: Laya.Sprite = null;
    private startBtnShine: Laya.Sprite = null;
    private startBtnBaseX: number = 0;
    private startBtnBaseY: number = 0;
    private frameTick: number = 0;

    onAwake(): void {
        Laya.stage.alignH = "center";
        Laya.stage.alignV = "middle";
        Laya.stage.scaleMode = "showall";
        Laya.stage.screenMode = "vertical";
        Laya.stage.bgColor = "#3D2F25";

        const sw = Math.max(320, Number(Laya.stage.width) || 0);
        const sh = Math.max(568, Number(Laya.stage.height) || 0);
        this.size(sw, sh);

        this.root = new Laya.Sprite();
        this.uiScale = Math.min(sw / this.designW, sh / this.designH);
        this.root.scale(this.uiScale, this.uiScale);
        this.root.pos((sw - this.designW * this.uiScale) / 2, (sh - this.designH * this.uiScale) / 2);
        this.safeTop = (sh >= 2400 ? 68 : 40) / this.uiScale;
        this.safeBottom = (sh >= 2400 ? 54 : 30) / this.uiScale;
        this.addChild(this.root);

        this.drawBackground();
        this.drawDecorCards();
        this.drawProps();
        this.drawLogoBlock();
        this.drawButtons();
        this.drawGridPreview();

        this.timer.frameLoop(1, this, this.updateHomeFx);
    }

    private drawBackground(): void {
        const bg = new Laya.Sprite();
        bg.graphics.drawRect(0, 0, this.designW, this.designH, "#735B45");
        this.root.addChild(bg);

        const shelfL = new Laya.Sprite();
        shelfL.graphics.drawRect(0, 0, 120, this.designH, "#4B392D");
        shelfL.alpha = 0.75;
        this.root.addChild(shelfL);

        const shelfR = new Laya.Sprite();
        shelfR.graphics.drawRect(this.designW - 120, 0, 120, this.designH, "#4B392D");
        shelfR.alpha = 0.75;
        this.root.addChild(shelfR);

        const glowOuter = new Laya.Sprite();
        glowOuter.graphics.drawRect(130, 170, this.designW - 260, 760, "#E0AE67");
        glowOuter.alpha = 0.42;
        this.root.addChild(glowOuter);

        const glowInner = new Laya.Sprite();
        glowInner.graphics.drawRect(220, 240, this.designW - 440, 560, "#FFD37C");
        glowInner.alpha = 0.52;
        this.root.addChild(glowInner);

        const haze = new Laya.Sprite();
        haze.graphics.drawRect(165, 140, this.designW - 330, 900, "#FFF0B8");
        haze.alpha = 0.08;
        this.root.addChild(haze);

        const burstCenterX = this.designW * 0.5;
        const burstCenterY = 360;
        for (let i = 0; i < 16; i++) {
            const ray = new Laya.Sprite();
            ray.graphics.drawRect(0, 0, 8, 420, i % 2 === 0 ? "#FFD787" : "#F2BD6A");
            ray.pivot(4, 420);
            ray.pos(burstCenterX, burstCenterY);
            ray.rotation = -70 + i * 9;
            ray.alpha = i % 2 === 0 ? 0.16 : 0.1;
            this.root.addChild(ray);
        }

        const confetti = [
            [84, 500, "#F4C55E"], [132, 612, "#5EC6F4"], [682, 520, "#F4C55E"], [612, 640, "#5EC6F4"],
            [212, 760, "#F4C55E"], [560, 812, "#5EC6F4"], [645, 882, "#F4C55E"], [94, 936, "#5EC6F4"],
            [120, 1098, "#E7BD67"], [650, 1122, "#E7BD67"], [150, 1240, "#5EC6F4"], [620, 1260, "#F4C55E"]
        ];
        confetti.forEach(([x, y, c]) => {
            const p = new Laya.Sprite();
            p.graphics.drawRect(0, 0, 10, 10, c as string);
            p.pos(x as number, y as number);
            p.alpha = 0.6;
            this.root.addChild(p);
        });

        for (let i = 0; i < 28; i++) {
            const dot = new Laya.Sprite();
            const size = 2 + (i % 3);
            dot.graphics.drawRect(0, 0, size, size, i % 2 === 0 ? "#FFE7A9" : "#FFD273");
            dot.pos(60 + (i * 47) % 640, 140 + (i * 83) % 980);
            dot.alpha = 0.18 + (i % 4) * 0.08;
            this.root.addChild(dot);
            this.particleDots.push(dot);
        }

        const vignetteTop = new Laya.Sprite();
        vignetteTop.graphics.drawRect(0, 0, this.designW, 160, "#3A2A21");
        vignetteTop.alpha = 0.22;
        this.root.addChild(vignetteTop);

        const vignetteBottom = new Laya.Sprite();
        vignetteBottom.graphics.drawRect(0, this.designH - 230, this.designW, 230, "#32251D");
        vignetteBottom.alpha = 0.28;
        this.root.addChild(vignetteBottom);
    }

    private drawDecorCards(): void {
        const cards = [
            { txt: "3", x: 650, y: 110 + this.safeTop * 0.22, bg: "#F5BE6F", fg: "#B45309" },
            { txt: "18", x: 540, y: 162 + this.safeTop * 0.22, bg: "#DDEFFF", fg: "#1F4E79" },
            { txt: "24", x: 620, y: 222 + this.safeTop * 0.2, bg: "#FFF0D8", fg: "#C03C23" },
            { txt: "7", x: 70, y: 315 + this.safeTop * 0.2, bg: "#FFE79A", fg: "#A16300" },
            { txt: "18", x: 108, y: 400 + this.safeTop * 0.18, bg: "#F0A3A3", fg: "#B52424" },
            { txt: "29", x: 550, y: 485 + this.safeTop * 0.15, bg: "#E7BD67", fg: "#7B4A00" }
        ];
        cards.forEach((c, i) => {
            const shadow = new Laya.Sprite();
            shadow.graphics.drawRect(0, 0, 58, 58, "#3D2F25");
            shadow.pos(c.x + 3, c.y + 4);
            shadow.alpha = 0.25;
            this.root.addChild(shadow);

            const s = new Laya.Sprite();
            s.graphics.drawRect(0, 0, 58, 58, c.bg);
            s.graphics.drawRect(0, 0, 58, 4, "#FFFFFF");
            s.pos(c.x, c.y);
            s.rotation = i % 2 === 0 ? 6 : -7;
            this.root.addChild(s);
            s.addChild(this.makeText(c.txt, 0, 6, 58, 42, 36, c.fg, true));
            this.floatCards.push(s);
            this.floatCardBaseY.push(c.y);
            this.floatCardBaseRot.push(s.rotation);
        });
    }

    private drawProps(): void {
        // Left top book + stopwatch
        const book = new Laya.Sprite();
        book.graphics.drawRect(36, 166, 176, 52, "#E8D6A5");
        this.root.addChild(book);
        const pages = new Laya.Sprite();
        pages.graphics.drawRect(52, 176, 156, 36, "#F7ECD1");
        this.root.addChild(pages);
        const watch = new Laya.Sprite();
        watch.graphics.drawRect(110, 132, 40, 40, "#C88B3A");
        this.root.addChild(watch);
        watch.addChild(this.makeText("•", 0, 4, 38, 24, 16, "#374151", true));

        // Right magnifier
        const magnifier = new Laya.Sprite();
        magnifier.graphics.drawRect(636, 280, 64, 64, "#7ED7E9");
        magnifier.graphics.drawRect(660, 342, 16, 68, "#8B5E34");
        this.root.addChild(magnifier);

        // Right-bottom hourglass
        const hg = new Laya.Sprite();
        hg.graphics.drawRect(634, 912, 90, 148, "#875526");
        hg.graphics.drawRect(648, 926, 64, 124, "#C58E57");
        hg.graphics.drawRect(658, 944, 44, 28, "#F0DEB2");
        hg.graphics.drawRect(658, 1014, 44, 28, "#F0DEB2");
        this.root.addChild(hg);

        // Left-bottom pencil
        const pencil = new Laya.Sprite();
        pencil.graphics.drawRect(26, 1135, 126, 14, "#F4A261");
        pencil.graphics.drawRect(152, 1135, 16, 14, "#EAD8C0");
        pencil.graphics.drawRect(16, 1135, 10, 14, "#2F3C68");
        this.root.addChild(pencil);
    }

    private drawLogoBlock(): void {
        const logoW = this.designW * 0.82;
        const logoX = (this.designW - logoW) / 2;
        const logoY = 76 + this.safeTop;

        const plateShadow = new Laya.Sprite();
        plateShadow.graphics.drawRect(0, 0, logoW, 150, "#06388D");
        plateShadow.pos(logoX + 4, logoY + 6);
        plateShadow.alpha = 0.5;
        this.root.addChild(plateShadow);

        const plate = new Laya.Sprite();
        plate.graphics.drawRect(0, 0, logoW, 146, "#0D49BF");
        plate.graphics.drawRect(0, 0, logoW, 6, "#68B2FF");
        plate.graphics.drawRect(0, 136, logoW, 10, "#073489");
        plate.pos(logoX, logoY);
        this.root.addChild(plate);

        const plateTop = new Laya.Sprite();
        plateTop.graphics.drawRect(0, 0, logoW, 68, "#2D82F0");
        plateTop.pos(logoX, logoY);
        this.root.addChild(plateTop);

        this.root.addChild(this.makeText("专注力星球", logoX + 6, logoY + 22, logoW, 84, 76, "#082E7D", true));
        this.root.addChild(this.makeText("专注力星球", logoX + 4, logoY + 18, logoW, 84, 76, "#0A3FA5", true));
        this.root.addChild(this.makeText("专注力星球", logoX + 2, logoY + 13, logoW, 84, 76, "#1E5DC9", true));
        this.root.addChild(this.makeText("专注力星球", logoX, logoY + 8, logoW, 84, 76, "#FFD95A", true));
        this.root.addChild(this.makeText("专注力星球", logoX, logoY + 2, logoW, 84, 76, "#FFF3A6", true));

        const ribbonW = 408;
        const ribbonX = (this.designW - ribbonW) / 2;
        const ribbonY = logoY + 144;
        const ribbon = new Laya.Sprite();
        ribbon.graphics.drawRect(0, 0, ribbonW, 54, "#0A47C3");
        ribbon.graphics.drawRect(0, 0, ribbonW, 4, "#56A0FF");
        ribbon.graphics.drawRect(0, 48, ribbonW, 6, "#083892");
        ribbon.pos(ribbonX, ribbonY);
        this.root.addChild(ribbon);
        const tailL = new Laya.Sprite();
        tailL.graphics.drawRect(0, 0, 24, 26, "#083FA8");
        tailL.pos(ribbonX - 20, ribbonY + 20);
        this.root.addChild(tailL);
        const tailR = new Laya.Sprite();
        tailR.graphics.drawRect(0, 0, 24, 26, "#083FA8");
        tailR.pos(ribbonX + ribbonW - 4, ribbonY + 20);
        this.root.addChild(tailR);
        this.root.addChild(this.makeText("SCHULTE GRID", ribbonX, ribbonY + 8, ribbonW, 34, 34, "#DDEBFF", true));
    }

    private drawButtons(): void {
        const defs = [
            { label: "开始游戏", c1: "#149825", c2: "#69F07D", action: "start" },
            { label: "挑战模式", c1: "#CF5F00", c2: "#FFC15C", action: "challenge" },
            { label: "排行榜", c1: "#0A75CB", c2: "#78D8FF", action: "rank" },
            { label: "设置", c1: "#6224BF", c2: "#C288FF", action: "settings" }
        ];

        const bw = this.designW * 0.72;
        const bh = 90;
        const gap = 16;
        const x = (this.designW - bw) / 2;
        const y0 = 486 + this.safeTop * 0.32;

        defs.forEach((d, i) => {
            const y = y0 + i * (bh + gap);
            const btn = new Laya.Sprite();
            btn.graphics.drawRect(2, 8, bw - 4, bh, "#1A1A1A");
            btn.alpha = 0.98;
            btn.graphics.drawRect(0, 0, bw, bh, d.c1);
            btn.graphics.drawRect(0, 0, bw, 6, "#FFFFFF");
            btn.graphics.drawRect(0, bh - 10, bw, 10, "#1B2632");
            btn.graphics.drawRect(6, 6, bw - 12, 36, d.c2);
            btn.graphics.drawRect(8, 44, bw - 16, 10, "#FFFFFF");
            btn.graphics.drawRect(8, bh - 18, bw - 16, 8, "#000000");
            btn.pos(x, y);
            btn.mouseEnabled = true;
            this.root.addChild(btn);

            this.drawButtonIcon(btn, d.label);
            btn.addChild(this.makeText(d.label, 80, 24, bw - 94, 56, 44, "#6E4200", true));
            btn.addChild(this.makeText(d.label, 78, 16, bw - 94, 56, 44, "#FFF5CF", true));

            if (d.action === "start") {
                this.startBtn = btn;
                this.startBtnBaseX = x;
                this.startBtnBaseY = y;
                this.startBtnShine = new Laya.Sprite();
                this.startBtnShine.graphics.drawRect(0, 0, 54, bh - 12, "#FFFFFF");
                this.startBtnShine.alpha = 0.15;
                this.startBtnShine.pos(12, 6);
                btn.addChild(this.startBtnShine);
            }

            btn.on(Event.TOUCH_START, this, () => {
                console.log("[Home] click:", d.label);
                btn.scale(0.97, 0.97);
                this.timer.frameOnce(2, this, () => btn.scale(1, 1));

                if (d.action === "start") {
                    this.currentDifficulty = 3;
                    this.timer.frameOnce(3, this, this.startGame);
                } else if (d.action === "challenge") {
                    this.currentDifficulty = 5;
                } else if (d.action === "rank") {
                    this.currentDifficulty = 4;
                }
            });
        });
    }

    private drawButtonIcon(btn: Laya.Sprite, label: string): void {
        const icon = new Laya.Sprite();
        icon.pos(48, 46);
        if (label === "开始游戏") {
            icon.graphics.drawRect(-16, -16, 32, 32, "#FFD94D");
            icon.graphics.drawRect(-16, -16, 32, 4, "#FFF4AE");
            icon.graphics.drawRect(-12, -8, 4, 16, "#2E8B2E");
            icon.graphics.drawRect(-8, -6, 4, 12, "#2E8B2E");
            icon.graphics.drawRect(-4, -4, 4, 8, "#2E8B2E");
            icon.graphics.drawRect(0, -2, 4, 4, "#2E8B2E");
        } else if (label === "挑战模式") {
            icon.graphics.drawRect(-12, -12, 24, 14, "#FFD95A");
            icon.graphics.drawRect(-16, -10, 4, 10, "#FFD95A");
            icon.graphics.drawRect(12, -10, 4, 10, "#FFD95A");
            icon.graphics.drawRect(-4, 2, 8, 8, "#FFD95A");
            icon.graphics.drawRect(-10, 10, 20, 4, "#C98A21");
        } else if (label === "排行榜") {
            icon.graphics.drawRect(-14, 4, 6, 10, "#EAF4FF");
            icon.graphics.drawRect(-4, -2, 6, 16, "#EAF4FF");
            icon.graphics.drawRect(6, -8, 6, 22, "#EAF4FF");
            icon.graphics.drawRect(-16, 14, 30, 4, "#7CC7F8");
        } else {
            icon.graphics.drawRect(-12, -4, 24, 8, "#EAF4FF");
            icon.graphics.drawRect(-4, -12, 8, 24, "#EAF4FF");
            icon.graphics.drawRect(-9, -9, 18, 18, "#EAF4FF");
            icon.graphics.drawRect(-4, -4, 8, 8, "#7C3BC8");
        }
        btn.addChild(icon);
    }

    private drawGridPreview(): void {
        const boardW = this.designW * 0.62;
        const boardH = boardW * 0.56;
        const boardX = (this.designW - boardW) / 2;
        const boardY = this.designH - boardH - 26 - this.safeBottom;

        const desk = new Laya.Sprite();
        desk.graphics.drawRect(18, boardY - 26, this.designW - 36, boardH + 88, "#7B5635");
        desk.alpha = 0.28;
        this.root.addChild(desk);

        const shadow = new Laya.Sprite();
        shadow.graphics.drawRect(0, 0, boardW, boardH, "#000000");
        shadow.alpha = 0.3;
        shadow.rotation = -6;
        shadow.pos(boardX + 12, boardY + 14);
        this.root.addChild(shadow);

        const paper = new Laya.Sprite();
        paper.graphics.drawRect(0, 0, boardW, boardH, "#F6E7C3");
        paper.graphics.drawRect(0, 0, boardW, 10, "#FFF4DA");
        paper.graphics.drawRect(0, boardH - 8, boardW, 8, "#D5C29A");
        paper.rotation = -5;
        paper.pos(boardX, boardY);
        this.root.addChild(paper);

        const cols = 5;
        const rows = 5;
        const cw = Math.floor((boardW - 10) / cols);
        const ch = Math.floor((boardH - 10) / rows);
        const palette = ["#2E8DDB", "#F3A346", "#2FAE59", "#DD4B3C", "#4C6FB9"];
        let n = 1;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = 5 + c * cw;
                const y = 5 + r * ch;
                const isColor = (r + c) % 3 === 0;
                const fill = isColor ? palette[(r + c) % palette.length] : "#F9F1DB";
                const cell = new Laya.Sprite();
                cell.graphics.drawRect(0, 0, cw - 2, ch - 2, fill);
                if (!isColor) cell.graphics.drawRect(0, 0, cw - 2, 4, "#EFE2C5");
                cell.pos(x, y);
                paper.addChild(cell);
                cell.addChild(this.makeText(`${n}`, 0, 0, cw - 2, ch - 2, 30, isColor ? "#FFFFFF" : "#4B5563", true));
                n++;
            }
        }
    }

    private updateHomeFx(): void {
        this.frameTick++;
        const t = this.frameTick * 0.05;

        for (let i = 0; i < this.floatCards.length; i++) {
            const c = this.floatCards[i];
            c.y = this.floatCardBaseY[i] + Math.sin(t + i * 0.8) * 4;
            c.rotation = this.floatCardBaseRot[i] + Math.sin(t * 0.6 + i) * 2.2;
        }

        for (let i = 0; i < this.particleDots.length; i++) {
            const d = this.particleDots[i];
            d.alpha = 0.16 + (Math.sin(t * 1.2 + i * 0.5) + 1) * 0.08;
        }

        if (this.startBtn) {
            const s = 1 + Math.sin(t * 1.6) * 0.03;
            this.startBtn.scale(s, s);
            this.startBtn.x = this.startBtnBaseX - (this.startBtn.width * (s - 1)) * 0.5;
            this.startBtn.y = this.startBtnBaseY - (this.startBtn.height * (s - 1)) * 0.5;
            if (this.startBtnShine) {
                const w = this.startBtn.width - 80;
                this.startBtnShine.x = 12 + ((this.frameTick * 2) % Math.max(80, w));
            }
        }
    }

    private makeText(
        text: string,
        x: number,
        y: number,
        width: number,
        height: number,
        fontSize: number,
        color: string,
        bold: boolean
    ): Laya.Text {
        const t = new Laya.Text();
        t.text = text;
        t.x = x;
        t.y = y;
        t.width = width;
        t.height = height;
        t.align = "center";
        t.valign = "middle";
        t.fontSize = fontSize;
        t.color = color;
        t.font = "Microsoft YaHei";
        t.bold = bold;
        return t;
    }

    private startGame(): void {
        Laya.Scene.load("scenes/Game.scene", this, (scene: Laya.Scene) => {
            Laya.stage.addChild(scene);
            scene["currentDifficulty"] = this.currentDifficulty;
            this.destroy();
        });
    }

    onDestroy(): void {
        this.timer.clear(this, this.updateHomeFx);
    }
}
