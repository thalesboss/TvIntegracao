#!/usr/bin/env python3
"""
Build script do sistema TV Integracao.

Combina os modulos de css/ em style.css, os modulos de js/ em script.js,
valida a sintaxe JavaScript e opcionalmente atualiza cache-busting no index.html.

Uso:
    python build.py
    python build.py --bump 19.0
    python build.py --check
"""

import argparse
from pathlib import Path
import re
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parent

CSS_FILES = [
    'variables.css',
    'sidebar.css',
    'topbar.css',
    'buttons.css',
    'cards.css',
    'ocorrencias.css',
    'layouts.css',
    'tabelas.css',
    'uploads.css',
    'modals.css',
    'toasts.css',
    'config.css',
    'quicklook.css',
    'checklist.css',
    'ronda.css',
]

JS_FILES = [
    '00-core.js',
    '01-popups.js',
    '02-db-service.js',
    '03-ocorrencias-render.js',
    '04-historico-data.js',
    '05-resolvidas-powerbi.js',
    '06-session-navigation.js',
    '07-media-idb.js',
    '08-recebimento.js',
    '09-compras.js',
    '10-ctrs.js',
    '10b-checklist.js',
    '10c-ronda-udi.js',
    '11-ocorrencias-actions.js',
    '12-lixeira-arquivados.js',
    '13-configuracoes.js',
    '14-historico-ui.js',
    '15-notificacoes-toasts.js',
    '16-dashboards-metricas.js',
    '17-orcamento.js',
    '17b-equipamentos.js',
    '18-init.js',
]


def strip_js_comments_and_strings(code: str) -> str:
    """Remove comentarios, strings e literais regex preservando quebras de linha."""
    out = []
    i = 0
    n = len(code)
    while i < n:
        c = code[i]
        if c == '\n':
            out.append(c)
            i += 1
        elif c == '/' and i + 1 < n and code[i + 1] == '/':
            while i < n and code[i] != '\n':
                i += 1
        elif c == '/' and i + 1 < n and code[i + 1] == '*':
            i += 2
            while i + 1 < n and not (code[i] == '*' and code[i + 1] == '/'):
                if code[i] == '\n':
                    out.append('\n')
                i += 1
            i += 2
        elif c in ('"', "'", '`'):
            quote = c
            out.append(' ')
            i += 1
            while i < n and code[i] != quote:
                if code[i] == '\\':
                    i += 2
                elif code[i] == '\n':
                    out.append('\n')
                    i += 1
                else:
                    i += 1
            i += 1
        elif c == '/' and i + 1 < n and code[i + 1] not in ('/', '*'):
            last = ''.join(out).rstrip()
            if last and last[-1] in '(=,:[!&|?{};~^+-*':
                out.append(' ')
                i += 1
                in_class = False
                while i < n:
                    if code[i] == '\\':
                        i += 2
                    elif code[i] == '[':
                        in_class = True
                        i += 1
                    elif code[i] == ']':
                        in_class = False
                        i += 1
                    elif code[i] == '/' and not in_class:
                        i += 1
                        break
                    elif code[i] == '\n':
                        break
                    else:
                        i += 1
                while i < n and code[i] in 'gimsuy':
                    i += 1
            else:
                out.append(c)
                i += 1
        else:
            out.append(c)
            i += 1
    return ''.join(out)


def validate_js_brackets(code: str, label: str) -> list:
    """Verifica balanceamento de (), [] e {} no codigo JS."""
    cleaned = strip_js_comments_and_strings(code)
    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}
    for l_idx, line in enumerate(cleaned.split('\n'), 1):
        for c_idx, ch in enumerate(line, 1):
            if ch in '([{':
                stack.append((ch, l_idx, c_idx))
            elif ch in ')]}':
                if not stack:
                    return [f'{label}: fechamento sem abertura {ch} em {l_idx}:{c_idx}']
                top, tl, tc = stack.pop()
                if top != pairs[ch]:
                    return [f'{label}: {top} aberto em {tl}:{tc} fechado por {ch} em {l_idx}:{c_idx}']
    if stack:
        top, tl, tc = stack[0]
        return [f'{label}: {len(stack)} delimitador(es) aberto(s); primeiro: {top} em {tl}:{tc}']
    return []


def read_text_normalized(path: Path) -> str:
    return path.read_text(encoding='utf-8-sig').lstrip('\ufeff').replace('\r\n', '\n')


def check_html_integrity(html_path: Path) -> list:
    """Verifica IDs duplicados no index.html."""
    html = read_text_normalized(html_path)
    ids = re.findall(r'\bid=["\']([^"\']+)["\']', html)
    counts = {}
    for item in ids:
        counts[item] = counts.get(item, 0) + 1
    dups = {k: v for k, v in counts.items() if v > 1}
    if dups:
        return [f'index.html: IDs duplicados encontrados: {dups}']
    return []


def bundle_css(write: bool = True) -> tuple:
    css_dir = ROOT / 'css'
    parts = ['/* TV Integracao — style.css (Gerado por build.py) */\n']
    missing = []
    for name in CSS_FILES:
        file_path = css_dir / name
        if not file_path.is_file():
            missing.append(name)
            continue
        content = read_text_normalized(file_path).strip('\n')
        parts.append(f'/* === css/{name} === */\n{content}\n')
    if missing:
        raise FileNotFoundError(f'Arquivos CSS ausentes: {missing}')
    bundled = '\n'.join(parts)
    if write:
        (ROOT / 'style.css').write_text(bundled, encoding='utf-8', newline='\n')
    return bundled, len(CSS_FILES)


def bundle_js(write: bool = True) -> tuple:
    js_dir = ROOT / 'js'
    parts = []
    missing = []
    errors = []
    for name in JS_FILES:
        file_path = js_dir / name
        if not file_path.is_file():
            missing.append(name)
            continue
        content = read_text_normalized(file_path).rstrip('\n')
        parts.append(content)
    if missing:
        raise FileNotFoundError(f'Arquivos JS ausentes: {missing}')

    bundled = '\n'.join(parts) + '\n'
    errors.extend(validate_js_brackets(bundled, 'script.js'))

    node_bin = shutil.which('node')
    if node_bin:
        for name in JS_FILES:
            mod_path = js_dir / name
            proc_mod = subprocess.run(
                [node_bin, '--check', str(mod_path)],
                capture_output=True,
                text=True,
            )
            if proc_mod.returncode != 0:
                errors.append(f'node --check ({name}) falhou: {proc_mod.stderr.strip()}')

    if not errors and write:
        (ROOT / 'script.js').write_text(bundled, encoding='utf-8', newline='\n')
        if node_bin:
            proc = subprocess.run(
                [node_bin, '--check', str(ROOT / 'script.js')],
                capture_output=True,
                text=True,
            )
            if proc.returncode != 0:
                errors.append(f'node --check falhou: {proc.stderr.strip()}')

    return bundled, len(JS_FILES), errors


def bump_index_versions(version: str) -> int:
    index_path = ROOT / 'index.html'
    html = read_text_normalized(index_path)
    pattern = re.compile(r'((?:style\.css|script\.js)\?v=)[^"\'\s>]+')
    new_html, count = pattern.subn(rf'\g<1>{version}', html)
    if count == 0:
        raise RuntimeError('Nenhuma referencia style.css?v= ou script.js?v= encontrada no index.html.')
    index_path.write_text(new_html, encoding='utf-8', newline='\n')
    return count


def main() -> int:
    parser = argparse.ArgumentParser(description='Compila e valida os bundles da TV Integracao.')
    parser.add_argument('--bump', metavar='VERSION', help='Atualiza ?v=VERSION de style.css e script.js no index.html')
    parser.add_argument('--check', action='store_true', help='Valida apenas sem sobrescrever style.css / script.js')
    args = parser.parse_args()

    write = not args.check
    css_bundled, css_count = bundle_css(write=write)
    js_bundled, js_count, errors = bundle_js(write=write)
    errors.extend(check_html_integrity(ROOT / 'index.html'))

    if errors:
        for err in errors:
            print(f'[ERRO] {err}', file=sys.stderr)
        return 1

    if args.bump:
        if args.check:
            print('[AVISO] --bump ignorado em modo --check.')
        else:
            updated = bump_index_versions(args.bump)
            print(f'[OK] index.html: {updated} referencia(s) atualizada(s) para v={args.bump}')

    mode_lbl = 'CHECK' if args.check else 'BUILD'
    print(f'[{mode_lbl} OK] CSS: {css_count} arquivos ({len(css_bundled.splitlines())} linhas, {len(css_bundled)} bytes)')
    print(f'[{mode_lbl} OK] JS:  {js_count} arquivos ({len(js_bundled.splitlines())} linhas, {len(js_bundled)} bytes)')
    print(f'[{mode_lbl} OK] Sintaxe JS e integridade do index.html validadas sem erros.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
