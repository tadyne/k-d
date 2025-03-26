import pygame
import sys
import random
import sqlite3
from pygame.locals import *
pygame.init()
import os
import getpass

username = os.getlogin()

def create_db():
    conn = sqlite3.connect("skore.db")
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS skore (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    score INTEGER,
                    username TEXT
                )''')
    conn.commit()
    conn.close()

# Zavoláme funkci pro vytvoření tabulky
create_db()


def get_high_score():                   #ziskava největší skore z tabulky
    conn = sqlite3.connect("skore.db")
    c = conn.cursor()
    c.execute("SELECT MAX(score) FROM skore")
    high_score = c.fetchone()[0]                # Získá nejvyšší skóre
    conn.close()
    return high_score if high_score is not None else 0

surface = pygame.display.set_mode((700,500))                    #setup okna
pygame.display.set_caption("dinosaurus")                        #název okna
img = pygame.image.load("dino game/game/Fred1.png")             #načítam Freda
pygame.display.set_icon(img)                                    #dávam freda jako ikonu


imp = pygame.image.load("dino game/game/background2.png").convert()    #dávám pozadí

ground_img = pygame.image.load('dino game/game/ground.png')          #nahrávám podlahu
button_img = pygame.image.load('dino game/game/restart.png')           #obrazky tlačitek
button_img2 = pygame.image.load('dino game/game/button skore.png')
button_img3 = pygame.image.load('dino game/game/button3.png')

surface.blit(imp, (0, 0))                       #nahrávam vizual obrazovky

font = pygame.font.Font(None, 30)               #styl a velikost písma
clock = pygame.time.Clock()                     #přidává čas

ground_scroll = 0
scroll_speed = 8                            #rychlost dinosaura
kaktus_freg = random.randint(1000, 2000)        #frekvence kaktusu a časové udaje k nim
last_kak = pygame.time.get_ticks() - kaktus_freg
kurent_time = pygame.time.get_ticks()
start_time = pygame.time.get_ticks()

def save_score(score):
    username = os.getlogin()  # Získáme uživatelské jméno
    conn = sqlite3.connect("skore.db")
    c = conn.cursor()
    c.execute("INSERT INTO skore (score, username) VALUES (?, ?)", (score, username))
    conn.commit()
    conn.close()
    
def get_all_scores():
    conn = sqlite3.connect("skore.db")
    c = conn.cursor()
    c.execute("SELECT score, username FROM skore ORDER BY score DESC")  # Seřazení od nejvyššího skóre
    scores = c.fetchall()
    conn.close()
    return scores  # Vrací seznam (skóre, username)

def reset_game():                       #funkce na restart hry a všech k tomu potřebných hodnot
    koral_group.empty()
    dino.rect.x = 150
    dino.rect.y = 300
    score = 0
    start_time = pygame.time.get_ticks()
    return score



#cela funkce pro dinosaura
class Fred(pygame.sprite.Sprite): 
    def __init__(self, x, y):
        #generace freda a všech jeho parametrů
        pygame.sprite.Sprite.__init__(self)
        self.images = []
        self.index = 0
        self.counter = 0
        for num in range (1, 4):                    #animace
            img = pygame.image.load(f"dino game/game/Fred{num}.png")
            self.images.append(img)
        self.image = self.images[self.index]
        self.rect = self.image.get_rect()
        self.rect.center = [x, y]
        self.mask = pygame.mask.from_surface(self.image)
        self.v = 10
        self.m = 1
        self.isjump = False

    #funkce pro skakaní
    def update(self):
        
        keys = pygame.key.get_pressed() 
        
        if self.isjump == False: 
            
            if keys[pygame.K_SPACE]: 
 
                self.isjump = True

            if keys[pygame.K_UP]: 
 
                self.isjump = True
        #celá funkce skákání     
        if self.isjump : 
             # výpočet síly a rychlosti 
            F =(2 / 9 )*self.m*(self.v**2)
            self.rect.y -= F 
            self.v = self.v -0.5
            if self.v<0: 
                self.m =-1

            #zastavení skoku
            if self.v == -11:   
                self.isjump = False
                self.rect.y = 300
                self.v = 10
                self.m = 1

        
        #dodělávání animace       
        run_cooldown = 5
        self.counter += 1
            
        if self.counter > run_cooldown:
            self.counter = 0
            self.index += 1
            if self.index >= len(self.images):
                self.index = 0
            self.image = self.images[self.index]



#clas po kaktusy
class Koral(pygame.sprite.Sprite):
    def __init__(self, x, y):
        pygame.sprite.Sprite.__init__(self)
        self.image = pygame.image.load("dino game/game/koral.png")
        self.rect = self.image.get_rect()
        self.rect.topleft = [x, y]
        self.mask = pygame.mask.from_surface(self.image)

    def update(self):
        self.rect.x -= scroll_speed
        if self.rect.right < 0:
            self.kill()


#funkce tlačitka restartu
class button():
    def __init__(self, x, y, image):
        self.image = image
        self.rect = self.image.get_rect()
        self.rect.topleft = (x, y)
        
    def draw(self):
        pos = pygame.mouse.get_pos()
        action = False
        
        
        if self.rect.collidepoint(pos):
            if pygame.mouse.get_pressed()[0] == 1:
                action = True
        
        surface.blit(self.image, (self.rect.x, self.rect.y))
        return action

#funkce tlačitka na zobrazeni skore
class button2():
    def __init__(self, x, y, image):
        self.image = image
        self.rect = self.image.get_rect()
        self.rect.topleft = (x, y)
        
    def draw(self):
        pos = pygame.mouse.get_pos()
        action = False
        
        
        if self.rect.collidepoint(pos):
            if pygame.mouse.get_pressed()[0] == 1:
                action = True
        
        surface.blit(self.image, (self.rect.x, self.rect.y))
        return action


#funkce tlačitka na vracení do endgamu
class button3():
    def __init__(self, x, y, image):
        self.image = image
        self.rect = self.image.get_rect()
        self.rect.topleft = (x, y)
        
    def draw(self):
        pos = pygame.mouse.get_pos()
        action = False
        
        
        if self.rect.collidepoint(pos):
            if pygame.mouse.get_pressed()[0] == 1:
                action = True
        
        surface.blit(self.image, (self.rect.x, self.rect.y))
        return action





Fred_group = pygame.sprite.Group()              #donastavuji funkci
koral_group = pygame.sprite.Group()   

dino = Fred(150, 350)                           #pozice Freda

Fred_group.add(dino)                            #zadávání skupiny dino

button = button(300, 150, button_img)           #zadávaní tlačítek
button2 = button2(300,250,button_img2)
button3 = button3(625,25,button_img3)
show_white_screen = False


mouse_released = False
game_over = False
running = True
while running:          #základní loop

    fps = 50
    clock.tick(fps)      #udává Fps
      
    #zobrazuji pozadí
    surface.blit(imp, (0, 0)) 
    surface.blit(ground_img, (ground_scroll, 400))
    #zobrazuji dino skupinu
    Fred_group.draw(surface)

    
    koral_group.draw(surface)


    
    # vytvářím text fps
    fps_text = font.render(f"FPS: {int(clock.get_fps())}", True, (0,0,0))
    surface.blit(fps_text, (10, 10))
    
    for koral in koral_group:
        if pygame.sprite.collide_mask(dino, koral):  
            game_over = True



    #hlavní herní loop
    if game_over == False:
        
        Fred_group.update()
        koral_group.update()
        time_now = pygame.time.get_ticks()
        if time_now - last_kak > kaktus_freg:           #spawnovani katusu
            korl = Koral(700, 340)
            koral_group.add(korl)
            last_kak = time_now
            
            
            kaktus_freg = random.randint(1000, 2000)
        

        kurent_time = pygame.time.get_ticks()
        
        skore = abs(start_time - kurent_time)
        last_speed_increase = 0  # Přidáme proměnnou pro kontrolu zvyšování rychlosti

        # nastavování skore
        current_score = skore // 100  # Celočíselné skóre
        if current_score % 100 == 0 and current_score != last_speed_increase:
            scroll_speed += 1
            kaktus_freg =kaktus_freg - 10
            last_speed_increase = current_score
        
       
    
       #text skore

        high_score = get_high_score()
        dynamic_high_score = high_score  # Proměnná, která se bude aktualizovat

        if current_score > high_score:
            dynamic_high_score = current_score  # Pokud hráč překonal rekord, high score se aktualizuje

        # Vykreslení aktuálního skóre
        score_text = font.render(f"Skóre: {int(current_score)}", True, (0, 0, 0))
        surface.blit(score_text, (570, 10))

        # Vykreslení dynamického nejlepšího skóre
        high_score_text = font.render(f"Nejlepší skóre: {dynamic_high_score}", True, (0, 0, 0))  # Červená pro zvýraznění
        surface.blit(high_score_text, (500, 40))



        
        # posun podlahy
        ground_scroll -= scroll_speed
        if abs(ground_scroll) > 35:
            ground_scroll = 0
            kurent_time = 10
            
        score_saved = False
            
        #konec hry a 2 tlacitka
    konechry_text = font.render(f"konec hry", True, (255,0,0))
    if game_over and not show_white_screen:
        surface.blit(konechry_text,(300,130))
        if not score_saved:  # Uložíme skóre jen pokud ještě nebylo uloženo
            save_score(int(current_score))
            score_saved = True  # Proměnná pro kontrolu uložení skóre

        if button.draw():
            game_over = False
            start_time = pygame.time.get_ticks()
            scroll_speed = 8
            score = reset_game()


        elif button2.draw():
            show_white_screen = True
            mouse_released = False


            

    #zobrazuji oba texty
    surface.blit(high_score_text, (500, 40))
    surface.blit(score_text, (570, 10))        
            

        #vypnutí pomocí x
    for event in pygame.event.get(): 
   
        if event.type == pygame.QUIT: 
 
            running = False
        if event.type == pygame.MOUSEBUTTONUP:
            mouse_released = True
            
    #zobrazení všech skore        
    if show_white_screen:
        surface.fill((255, 255, 255))  # Bílé pozadí
        all_scores = get_all_scores()
        font = pygame.font.Font(None, 30)

        col_width = 200
        start_x = 50
        start_y = 50
        row_spacing = 30

        for index, (score, username) in enumerate(all_scores, start=1):  # Načítáme skóre i jméno
                col = (index - 1) % 3  # Rozdělení do sloupců
                row = (index - 1) // 3
                x_pos = start_x + col * col_width
                y_pos = start_y + row * row_spacing

                # Číslo pořadí černě
                index_text = font.render(f"{index}.", True, (0, 0, 0))  
                surface.blit(index_text, (x_pos, y_pos))

                # Skóre zlatě
                score_text = font.render(f"{score}", True, (255, 150, 0))  
                surface.blit(score_text, (x_pos + 30, y_pos))

                # Uživatelské jméno modře
                username_text = font.render(f"{username}", True, (0, 255, 255))  
                surface.blit(username_text, (x_pos + 80, y_pos))


        # Vykreslení tlačítka zpět
        if button3.draw():
            score_text = font.render(f"Skóre: {int (skore/100)}", True, (0,0,0))
            show_white_screen = False  # Návrat na End Screen
    pygame.display.update()
      

 
  
# closes the pygame window  
pygame.quit()
sys.exit()
         

