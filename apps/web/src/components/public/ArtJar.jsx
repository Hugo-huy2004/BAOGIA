import { useEffect, useRef } from "react";

/**
 * "Lọ thẻ" trên trang Dịch vụ: các thẻ màu rơi vào lọ khi cuộn tới, nảy lên,
 * trượt theo độ nghiêng điện thoại (hoặc vị trí con trỏ trên máy tính) và kéo
 * thả được. Vật lý do matter-js lo, chỉ tải khi lọ sắp lọt vào màn hình.
 *
 * Thẻ là DOM thật (chữ nét, đọc được bằng trình đọc màn hình); vòng lặp chỉ
 * ghi `transform`, không setState. Bước vật lý cố định 1/120s theo đồng hồ
 * thật — máy 120Hz hay 30Hz thì thẻ vẫn rơi cùng tốc độ.
 */
const STEP_MS = 1000 / 120;
const MAX_STEPS = 8;
// Tỉ lệ diện tích lọ mà các thẻ chiếm: đủ "nghẹt" mà vật lý vẫn xếp lọt.
const FILL = 0.66;
const RATIO = 0.6;

export default function ArtJar({ messages }) {
  const jarRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const jar = jarRef.current;
    if (!jar || !messages.length) return undefined;
    // Giảm chuyển động: thẻ nằm yên theo lưới CSS, không chạy vật lý.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      jar.classList.add("svc-jar--still");
      return undefined;
    }

    let disposed = false;
    let cleanup = () => {};

    const start = async () => {
      // matter-js là gói CommonJS: bản dev và bản build trả export khác chỗ.
      const mod = await import("matter-js");
      const { Engine, Events, Body, Bodies, Composite, Constraint } = mod.default || mod;
      if (disposed) return;

      const width = jar.clientWidth;
      const height = jar.clientHeight;
      // Cỡ thẻ suy từ diện tích lọ, nên lọ to hay nhỏ thì thẻ cũng lấp gần đầy.
      const cardW = Math.min(width * 0.48, Math.sqrt((FILL * width * height) / (messages.length * RATIO)));
      const cardH = cardW * RATIO;
      const engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.0012 } });
      const wall = { isStatic: true, restitution: 0.4, friction: 0.2 };
      Composite.add(engine.world, [
        Bodies.rectangle(width / 2, height + 30, width * 2, 60, wall),
        Bodies.rectangle(-30, -height / 2, 60, height * 4, wall),
        Bodies.rectangle(width + 30, -height / 2, 60, height * 4, wall),
      ]);

      // Thả theo cột ngay trên miệng lọ, hàng sau rơi sau, lệch nhẹ cho tự nhiên.
      const cols = Math.max(1, Math.floor(width / cardW));
      // Giữ BẢN CHỤP các thẻ lúc dựng. Đọc thẳng cardRefs.current trong vòng vẽ
      // là hỏng: khi danh sách đổi, React gán ref = null ngay lúc commit nhưng
      // dọn effect này muộn hơn, một khung rAF chen giữa sẽ gặp null
      // ("null is not an object (evaluating 'r.current[t].style')" trên Safari).
      const nodes = cardRefs.current.slice(0, messages.length).filter(Boolean);
      const bodies = nodes.map((node, index) => {
        node.style.width = `${cardW}px`;
        node.style.height = `${cardH}px`;
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = cardW / 2 + (cols > 1 ? (col / (cols - 1)) * (width - cardW) : (width - cardW) / 2) + (((index * 37) % 9) - 4) * 2;
        const body = Bodies.rectangle(x, -cardH * (0.8 + row * 1.25), cardW, cardH, {
          chamfer: { radius: 18 },
          restitution: 0.55,
          friction: 0.25,
          frictionAir: 0.012,
          angle: ((index % 5) - 2) * 0.08,
        });
        Composite.add(engine.world, body);
        return body;
      });

      // Lực tự dựng: thẻ vẫn nghiêng, nảy, nhưng luôn ngả về thế đứng thẳng
      // để chữ đọc được (không nằm lộn ngược). Thẻ đang bị kéo thì để yên.
      Events.on(engine, "beforeUpdate", () => {
        bodies.forEach((body) => {
          if (drag?.bodyB === body) return;
          const angle = Math.atan2(Math.sin(body.angle), Math.cos(body.angle));
          Body.setAngularVelocity(body, body.angularVelocity * 0.985 - angle * 0.0016);
        });
      });

      const paint = () => {
        bodies.forEach((body, index) => {
          const { x, y } = body.position;
          nodes[index].style.transform = `translate(${x - cardW / 2}px, ${y - cardH / 2}px) rotate(${body.angle}rad)`;
        });
      };

      // Nghiêng: điện thoại dùng cảm biến, máy tính dùng vị trí con trỏ.
      const setTilt = (gx) => {
        engine.gravity.x = Math.max(-0.8, Math.min(0.8, gx));
        jar.style.setProperty("--tilt", `${(engine.gravity.x * 6).toFixed(2)}deg`);
      };
      const onOrientation = (event) => {
        if (event.gamma == null) return;
        setTilt(Math.sin((event.gamma * Math.PI) / 180) * 1.4);
      };
      const onHover = (event) => {
        if (event.pointerType !== "mouse" || drag) return;
        const rect = jar.getBoundingClientRect();
        setTilt(((event.clientX - rect.left) / rect.width - 0.5) * 0.9);
      };
      const onLeave = () => { if (!drag) setTilt(0); };

      // iOS chỉ cho đọc cảm biến sau một cú chạm của người dùng.
      let askedMotion = false;
      const askMotion = () => {
        if (askedMotion) return;
        askedMotion = true;
        const request = window.DeviceOrientationEvent?.requestPermission;
        if (typeof request === "function") request().catch(() => {});
      };

      // Kéo thả: gắn một lò xo từ con trỏ tới đúng điểm đã nắm trên thẻ.
      let drag = null;
      const toLocal = (event) => {
        const rect = jar.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
      };
      const onDown = (event) => {
        askMotion();
        const index = nodes.indexOf(event.target.closest(".svc-jar__card"));
        if (index < 0) return;
        const body = bodies[index];
        const point = toLocal(event);
        const dx = point.x - body.position.x;
        const dy = point.y - body.position.y;
        const cos = Math.cos(-body.angle);
        const sin = Math.sin(-body.angle);
        drag = Constraint.create({
          pointA: point,
          bodyB: body,
          pointB: { x: dx * cos - dy * sin, y: dx * sin + dy * cos },
          stiffness: 0.08,
          damping: 0.1,
          length: 0,
        });
        Composite.add(engine.world, drag);
        jar.setPointerCapture(event.pointerId);
        event.preventDefault();
      };
      const onMove = (event) => {
        if (drag) drag.pointA = toLocal(event);
      };
      const onUp = () => {
        if (!drag) return;
        Composite.remove(engine.world, drag);
        drag = null;
      };

      // Chỉ chạy khi lọ đang trên màn hình; thả thẻ ở lần đầu nhìn thấy.
      let raf = 0;
      let last = 0;
      let acc = 0;
      const tick = (now) => {
        acc += Math.min(now - (last || now), STEP_MS * MAX_STEPS);
        last = now;
        while (acc >= STEP_MS) {
          Engine.update(engine, STEP_MS);
          acc -= STEP_MS;
        }
        paint();
        raf = requestAnimationFrame(tick);
      };
      const observer = new IntersectionObserver(([entry]) => {
        cancelAnimationFrame(raf);
        if (entry.isIntersecting) {
          last = 0;
          raf = requestAnimationFrame(tick);
        }
      }, { threshold: 0.15 });

      paint();
      jar.classList.add("svc-jar--live");
      observer.observe(jar);
      window.addEventListener("deviceorientation", onOrientation);
      jar.addEventListener("pointermove", onHover);
      jar.addEventListener("pointerleave", onLeave);
      jar.addEventListener("pointerdown", onDown);
      jar.addEventListener("pointermove", onMove);
      jar.addEventListener("pointerup", onUp);
      jar.addEventListener("pointercancel", onUp);

      cleanup = () => {
        cancelAnimationFrame(raf);
        observer.disconnect();
        window.removeEventListener("deviceorientation", onOrientation);
        jar.removeEventListener("pointermove", onHover);
        jar.removeEventListener("pointerleave", onLeave);
        jar.removeEventListener("pointerdown", onDown);
        jar.removeEventListener("pointermove", onMove);
        jar.removeEventListener("pointerup", onUp);
        jar.removeEventListener("pointercancel", onUp);
        Engine.clear(engine);
      };
    };

    // Chưa tới gần thì chưa tải matter-js.
    const loader = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      loader.disconnect();
      start();
    }, { rootMargin: "300px 0px" });
    loader.observe(jar);

    return () => {
      disposed = true;
      loader.disconnect();
      cleanup();
    };
  }, [messages]);

  return (
    <div ref={jarRef} className="svc-jar">
      <ul className="svc-jar__cards">
        {messages.map((message, index) => (
          <li key={message} ref={(node) => { cardRefs.current[index] = node; }} className="svc-jar__card">
            <span>{message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
