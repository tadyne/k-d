import pygame
import sys
import random
from pygame.locals import *
pygame.init()


surface = pygame.display.set_mode((700,500))    #setup okna
pygame.display.set_caption("dinosaurus")        #název okna
img = pygame.image.load("dino game/.venv/Fred1.png")       #načítam Freda
pygame.display.set_icon(img)                    #dávam freda jako ikonu


imp = pygame.image.load("dino game/.venv/background.png").convert()    #dávám pozadí

ground_img = pygame.image.load('dino game/.venv/ground.png')          #nahrávám podlahu
button_img = pygame.image.load('dino game/.venv/restart.png') 

surface.blit(imp, (0, 0))                       #nahrávam vizual obrazovky

font = pygame.font.Font(None, 30)               #styl a velikost písma
clock = pygame.time.Clock()                     #přidává čas

ground_scroll = 0
scroll_speed = 8                              #rychlost dinosaura
kaktus_freg = 2000
last_kak = pygame.time.get_ticks() - kaktus_freg
kurent_time = 0
start_time = 0


def reset_game():
    koral_group.empty()
    dino.rect.x = 150
    dino.rect.y = 300
    score = 0
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
            img = pygame.image.load(f"dino game/.venv/Fred{num}.png")
            self.images.append(img)
        self.image = self.images[self.index]
        self.rect = self.image.get_rect()
        self.rect.center = [x, y]
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
            F =(2 / 3 )*self.m*(self.v**2) 
            self.rect.y -= F 
            self.v = self.v -1
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




class Koral(pygame.sprite.Sprite):
    def __init__(self, x, y):
        pygame.sprite.Sprite.__init__(self)
        self.image = pygame.image.load("dino game/.venv/koral.png")
        self.rect = self.image.get_rect()
        self.rect.topleft = [x, y]

    def update(self):
        self.rect.x -= scroll_speed
        if self.rect.right < 0:
            self.kill()



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


Fred_group = pygame.sprite.Group()              #donastavuji funkci
koral_group = pygame.sprite.Group()   

dino = Fred(150, 350)                           #pozice Freda

Fred_group.add(dino)                            #zadávání skupiny dino

button = button(300, 200, button_img)



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
    

    if pygame.sprite.groupcollide(Fred_group, koral_group, False, False):
        game_over = True

    skore = int(pygame.time.get_ticks() / 100)



    if game_over == False:
        
        Fred_group.update()
        koral_group.update()
        time_now = pygame.time.get_ticks()
        if time_now - last_kak > kaktus_freg:
            korl = Koral(700, 340)
            koral_group.add(korl)
            last_kak = time_now
        
        skore = start_time - kurent_time

        start_time = pygame.time.get_ticks() 
    
        score_text = font.render(f"Skóre: {int (skore/100)}", True, (0,0,0))



        if skore >= 100:
            scroll_speed = 8
        
        
        # posun podlahy
       
        ground_scroll -= scroll_speed
        if abs(ground_scroll) > 35:
            ground_scroll = 0
            kurent_time = 10
            
            
            
            
    if game_over == True:
        if button.draw() == True:
            game_over = False
            score = reset_game()
            print ("pico")
            

        #vypnutí pomocí x
    for event in pygame.event.get(): 
   
        if event.type == pygame.QUIT: 
 
            running = False
    surface.blit(score_text, (570, 10))
    pygame.display.update()
      

 
  
# closes the pygame window  
pygame.quit()
sys.exit()
         

