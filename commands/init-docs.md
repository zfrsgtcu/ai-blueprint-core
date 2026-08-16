---
name: init-docs
description: "Proje dokümantasyonunu otomatik oluşturur"
---

# /init-docs

## Ne yapar?
Projenin yapısını analiz eder ve aşağıdaki dokümanları oluşturur/günceller:
- `README.md` - Proje özeti, kurulum, kullanım
- `CLAUDE.md` - Claude Code için proje bağlamı
- `ARCHITECTURE.md` - Mimari kararlar ve yapı

## Nasıl çalışır?
1. Proje yapısını tarar (package.json, src/, config/ vs.)
2. Mevcut dokümanları okur
3. Eksik bilgileri tamamlar veya yeni oluşturur
4. Kullanıcıya sonucu gösterir

## Çıktı formatı
Otomatik olarak proje kök dizinine dokümanlar yazılır.
Mevcut dosyalar varsa, kullanıcıya onay sorulur.
