"use client";

import { useState } from "react";
import { Sprite } from "@/pixel/components/Sprite";
import {
  ACCESSORIES,
  EYE_COLOURS,
  EYE_STYLES,
  HAIR_COLOURS,
  HAIR_STYLES,
  HATS,
  OUTFIT_COLOURS,
  OUTFITS,
  requiredLevel,
  SHOE_COLOURS,
  SHOES,
  SKINS,
} from "@/pixel/game/options";
import type { Appearance } from "@/pixel/types";

const TABS = ["Hair", "Face", "Clothes", "Extras"] as const;

export function Creator({
  appearance,
  name,
  level,
  busy,
  onSave,
}: {
  appearance: Appearance;
  name: string;
  level: number;
  busy: boolean;
  onSave: (name: string, appearance: Appearance) => void;
}) {
  const [look, setLook] = useState(appearance);
  const [characterName, setCharacterName] = useState(name);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Hair");

  function set<K extends keyof Appearance>(key: K, value: Appearance[K]) {
    setLook((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="overlay">
      <form
        className="creator wood"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(characterName, look);
        }}
      >
        <header className="wood-bar">
          <h2>Character studio</h2>
        </header>
        <div className="creator-body">
          <div className="mirror">
            <Sprite appearance={look} scale={6} />
            <p>This is who the office will see.</p>
          </div>
          <div>
            <label htmlFor="character-name">Character name</label>
            <input id="character-name" value={characterName} maxLength={18} onChange={(event) => setCharacterName(event.target.value)} required />
            <div className="filters" role="tablist">
              {TABS.map((item) => (
                <button key={item} type="button" className={tab === item ? "chip on" : "chip"} onClick={() => setTab(item)} aria-pressed={tab === item}>
                  {item}
                </button>
              ))}
            </div>
            {tab === "Hair" ? (
              <>
                <Choice label="Hairstyle" options={HAIR_STYLES} value={look.hair} level={level} onPick={(id) => set("hair", id)} />
                <Swatches label="Hair colour" options={HAIR_COLOURS} value={look.hairColour} onPick={(id) => set("hairColour", id)} />
              </>
            ) : null}
            {tab === "Face" ? (
              <>
                <Swatches label="Skin" options={SKINS} value={look.skin} onPick={(id) => set("skin", id)} />
                <Choice label="Eyes" options={EYE_STYLES} value={look.eyes} level={level} onPick={(id) => set("eyes", id)} />
                <Swatches label="Eye colour" options={EYE_COLOURS} value={look.eyeColour} onPick={(id) => set("eyeColour", id)} />
              </>
            ) : null}
            {tab === "Clothes" ? (
              <>
                <Choice label="Outfit" options={OUTFITS} value={look.outfit} level={level} onPick={(id) => set("outfit", id)} />
                <Swatches label="Colour" options={OUTFIT_COLOURS} value={look.outfitColour} onPick={(id) => set("outfitColour", id)} />
                <Choice label="Shoes" options={SHOES} value={look.shoes} level={level} onPick={(id) => set("shoes", id)} />
                <Swatches label="Shoe colour" options={SHOE_COLOURS} value={look.shoeColour} onPick={(id) => set("shoeColour", id)} />
              </>
            ) : null}
            {tab === "Extras" ? (
              <>
                <Choice label="Accessory" options={ACCESSORIES} value={look.accessory} level={level} onPick={(id) => set("accessory", id)} />
                <Choice label="Hat" options={HATS} value={look.hat} level={level} onPick={(id) => set("hat", id)} />
              </>
            ) : null}
            <div className="row-actions">
              <button type="submit" className="pxbtn" disabled={busy || !characterName.trim()}>Save this look</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function Choice<T extends string>({
  label,
  options,
  value,
  level,
  onPick,
}: {
  label: string;
  options: { id: T; name: string; level?: number }[];
  value: T;
  level: number;
  onPick: (id: T) => void;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <div className="choices">
        {options.map((option) => {
          const locked = requiredLevel(option.id) > level;
          return (
            <button
              key={option.id}
              type="button"
              className={value === option.id ? "chip on" : "chip"}
              aria-pressed={value === option.id}
              disabled={locked}
              onClick={() => onPick(option.id)}
            >
              {option.name}
              {locked ? ` · level ${requiredLevel(option.id)}` : ""}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Swatches({
  label,
  options,
  value,
  onPick,
}: {
  label: string;
  options: { id: string; name: string; hex: string }[];
  value: string;
  onPick: (id: string) => void;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <div className="swatches">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={value === option.id ? "swatch on" : "swatch"}
            style={{ background: option.hex }}
            aria-label={option.name}
            aria-pressed={value === option.id}
            onClick={() => onPick(option.id)}
          />
        ))}
      </div>
    </fieldset>
  );
}
