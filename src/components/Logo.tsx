export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <img
      src="/icons/logo-mark.svg"
      width={size}
      height={size}
      alt="Vallavan"
      className="no-select"
    />
  );
}

export function LogoFull({ size = 36 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2 no-select">
      <img src="/icons/logo-mark.svg" width={size} height={size} alt="Vallavan" />
      <div className="leading-none">
        <div className="font-black text-white text-lg tracking-wide">VALLAVAN</div>
        <div className="text-[7px] tracking-[0.18em] text-vmuted font-medium uppercase">Documentaries That Matter</div>
      </div>
    </div>
  );
}

export function LogoText() {
  return (
    <div className="leading-none no-select">
      <div className="font-black text-white text-lg tracking-wide">VALLAVAN</div>
      <div className="text-[7px] tracking-[0.18em] text-vmuted font-medium uppercase">Documentaries That Matter</div>
    </div>
  );
}
